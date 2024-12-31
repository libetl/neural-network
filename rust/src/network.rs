use rand::{seq::SliceRandom, Rng};
use serde::{Serialize, Deserialize};
use evalexpr::*;
use serde_json::json;
use std::collections::HashMap;
use lazy_static::lazy_static;
use crate::network::Neuron::HiddenLayerNeuron;
use crate::network::Neuron::InputNeuron;
use crate::network::Neuron::OutputNeuron;
use web_sys::console;

pub trait Adjustable {
    fn adjust_field(&mut self, field_name: &str, value: f64);
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Link {
    pub neuron: usize,
    pub number: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct SavedValue {
    neuron: usize,
    number: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WeightsAndBias {
    pub weights: Vec<Link>,
    pub bias: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct ProcessResult {
    neuron: usize,
    raw_value: f64,
    number: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Input {
    x: f64,
    y: f64
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessingData {
    input: Input,
    saved_value: Vec<SavedValue>
}

#[derive(Debug, Clone)]
pub struct TrainingDataset {
    inputs: Vec<Input>,
    theory: Vec<evalexpr::Node<evalexpr::DefaultNumericTypes>>,
    expected_results: Vec<Vec<f64>>,
    rounds: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Derivatives {
    output_error: f64,
    input_error: f64,
    accumulated_from_input_error: f64,
    number_of_accumulated_errors: usize,
    links_derivatives: Vec<Link>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CostSummary {
    costs: Vec<f64>,
    average: f64,
}

pub struct TrainingResult {
    weights_and_biases: Vec<Vec<WeightsAndBias>>,
    remaining_cost: f64,
    remaining_cost_list: Vec<f64>,
    pub trained_network: Network
}

pub struct ActivationFunction {
    apply: fn(f64) -> f64,
    derivative: fn(f64) -> f64,
}

#[derive(Debug)]
pub struct Network {
    name: String,
    neurons: Vec<Vec<Box<Neuron>>>,
    mini_batch_length: Option<usize>,
    activation_function: String,
    random_init: bool,
}

impl TrainingResult {
    pub fn to_string(&self) -> String {
        let weights_and_biases: Vec<Vec<serde_json::Value>> = self.weights_and_biases.iter().map(|layer| {
            let result: Vec<serde_json::Value> = 
            layer.iter().map(|n|json!({"bias": n.bias, "weights": n.weights})).collect();
            result
    }).collect();
        serde_json::to_string(&json!({
            "type": "TrainingResult", 
            "remainingCost": self.remaining_cost, 
            "remainingCostList": self.remaining_cost_list,
            "trainedNetwork": self.trained_network.to_json(),
            "weightsAndBiases": weights_and_biases
    })).unwrap() 
    }
}

impl Input {
    fn to_context(&self) -> HashMapContext<DefaultNumericTypes> {
        context_map! {
            "x" => float self.x,
            "y" => float self.y
            }.unwrap()
    }
}

impl ProcessingData {
    pub fn from(processing_data: Self, previous_results: &Vec<ProcessResult>) -> Self {
        Self {
            input: processing_data.input,
            saved_value: previous_results.iter().map(|previous_result|SavedValue {
                neuron: previous_result.neuron,
                number: previous_result.number
            }).collect()
        }
    }
}

impl TrainingDataset {
    pub fn new(training_size: usize, theory: Vec<String>, variables_amplitude: f64, rounds: usize) -> Self {
        let mut rng = rand::thread_rng();
        let mut inputs: Vec<Input> = (0..training_size).map(|i| {
            let amplitude = if i < training_size / 3 {
                5.0
            } else if i < training_size / 2 {
                10.0
            } else {
                variables_amplitude
            };

            Input {
                x: (rng.gen_range(0.0..amplitude * 100.0) - (amplitude * 100.0) / 2.0) / 100.0,
                y: (rng.gen_range(0.0..amplitude * 100.0) - (amplitude * 100.0) / 2.0) / 100.0,
            }
        }).collect();

        inputs.shuffle(&mut rng);

        let parsed_theory: Vec<evalexpr::Node<evalexpr::DefaultNumericTypes>> = 
        theory.iter().map(|expr_as_string| {
            //console::log_1(&expr_as_string.into());
            build_operator_tree(expr_as_string).unwrap()
        }).collect();
        TrainingDataset {
            inputs,
            theory: parsed_theory,
            expected_results: vec![vec![0_f64; 0]; 0],
            rounds
        }
    }
}

fn tanh (x: f64) -> f64 { x.tanh() }
fn tanh_derivative (x: f64) -> f64 { 1.0 - x.tanh().powi(2) }
fn sigmoid (x: f64) -> f64 {1.0 / (1.0 + (-x).exp()) }
fn sigmoid_derivative (x: f64) -> f64 {
    let sig = 1.0 / (1.0 + (-x).exp());
    sig * (1.0 - sig)
}
fn elu (x: f64) -> f64 { if x > 0.0 { x } else { 15.0 * (x.exp() - 1.0) } }
fn elu_derivative (x: f64) -> f64 { if x > 0.0 { 1.0 } else { x.exp() } }
fn relu (x: f64) -> f64 { x.max(0.0) }
fn relu_derivative (x: f64) -> f64 { if x > 0.0 { 1.0 } else { 0.0 } }

lazy_static!{
    static ref activation_functions: HashMap<String, ActivationFunction> = vec![
        ("tanh", ActivationFunction { apply: tanh, derivative: tanh_derivative }),
        ("sigmoid", ActivationFunction { apply: sigmoid, derivative: sigmoid_derivative }),
        ("sigmoid", ActivationFunction { apply: sigmoid, derivative: sigmoid_derivative }),
        ("tanh", ActivationFunction { apply: tanh, derivative: tanh_derivative }),
        ("sigmoid", ActivationFunction { apply: sigmoid, derivative: sigmoid_derivative }),
        ("elu", ActivationFunction { apply: elu, derivative: elu_derivative }),
        ("relu", ActivationFunction { apply: relu, derivative: relu_derivative }),
    ].into_iter().fold(HashMap::new(), |mut m: HashMap<String, ActivationFunction>, e: (&str, ActivationFunction)|  {
        m.insert(String::from(e.0), e.1);
        m});
}

#[derive(Serialize, Deserialize)]
struct AbstractNeuron {
    bias: f64,
}

impl AbstractNeuron {
    fn new(bias: f64) -> Self {
        Self { bias }
    }
}

#[derive(Debug)]
enum Neuron {
    InputNeuron {
        execute: evalexpr::Node<evalexpr::DefaultNumericTypes>,
        bias: f64,
    },
    HiddenLayerNeuron {
        weights: Vec<Link>,
        bias: f64,
    },
    OutputNeuron {
        weights: Vec<Link>,
        bias: f64,
    }
}


impl Adjustable for Link {
    fn adjust_field(&mut self, field_name: &str, value: f64) {
        match field_name {
            "number" => self.number += value,
            _ => {}
        }
    }
}

impl Adjustable for Neuron {
    fn adjust_field(&mut self, field_name: &str, value: f64) {
        match self {
            InputNeuron { execute: _, bias } => 
            match field_name {
                "bias" => { *bias += value; }
                _ => {}
            },
            HiddenLayerNeuron { weights: _, bias } => 
            match field_name {
                "bias" => { *bias += value; }
                _ => {}
            },
            OutputNeuron { weights: _, bias } => 
            match field_name {
                "bias" => { *bias += value; }
                _ => {}
            }
        }
    }
}

impl crate::network::Neuron {
    fn clone(&self) -> Neuron {
        match self {
            InputNeuron { execute, bias } => InputNeuron { execute: execute.clone(), bias: *bias },
            HiddenLayerNeuron { weights, bias } => HiddenLayerNeuron { weights: weights.clone(), bias: *bias },
            OutputNeuron { weights, bias } => OutputNeuron { weights: weights.clone(), bias: *bias },
        }
    }
    fn process(&self, processing_data: ProcessingData) -> f64 {
        match self {
            InputNeuron { execute, bias } => (execute.eval_with_context(
                &processing_data.input.to_context()
            )).unwrap().as_float().unwrap() + bias,
            HiddenLayerNeuron { weights, bias } => {
                let combined: f64 = processing_data.saved_value.iter().map(|sv| {
                    let weight = weights.iter().find(|w| w.neuron == sv.neuron).map_or(0.0, |w| w.number);
                    sv.number * weight
                }).sum();
                combined + bias
            },
            OutputNeuron { weights, bias } => {
                let combined: f64 = processing_data.saved_value.iter().map(|sv| {
                    let weight = weights.iter().find(|w| w.neuron == sv.neuron).map_or(0.0, |w| w.number);
                    sv.number * weight
                }).sum();
                combined + bias
            },
        }
    }

    pub fn to_json(&self) -> serde_json::Value {
        match self {
            InputNeuron { execute: _, bias } => 
            json!({ "type": "input", "bias": bias }),
            HiddenLayerNeuron { weights, bias } => {
                let weights: Vec<serde_json::Value> = weights.iter()
        .enumerate()
        .map(|(i, w)| json!({"num": i, "weight": w.number}))
        .collect();
        json!({ 
            "type": "hidden",
            "weights": weights,
        "bias": bias })
            },
            OutputNeuron { weights, bias } => {
                let weights: Vec<serde_json::Value> = weights.iter()
        .enumerate()
        .map(|(i, w)| json!({"num": i, "weight": w.number}))
        .collect();
        json!({ 
            "type": "output",
            "weights": weights,
        "bias": bias })
            },
        }
    }

    pub fn to_string(&self) -> String { serde_json::to_string(&self.to_json()).unwrap() }
}

impl Network {
    pub fn new(
        name: Option<String>,
        number_by_layer: Vec<usize>,
        parameters: Vec<String>,
        weights_and_biases: Option<Vec<Vec<WeightsAndBias>>>,
        trainings: Option<TrainingDataset>,
        mini_batch_length: Option<usize>,
        activation_function: Option<String>,
        random_init: Option<bool>,
    ) -> Self {
        //console::log_1(&number_by_layer.iter().map(|number|number.to_string()).collect::<String>().into());

        let random_init = random_init.unwrap_or(true);

        let mut rng = rand::thread_rng();

        let expr_parameters: Vec<evalexpr::Node<evalexpr::DefaultNumericTypes>> = parameters.iter()
        .map(|expr| build_operator_tree::<DefaultNumericTypes>(expr).unwrap())
        .collect();

        let neurons: Vec<Vec<Box<Neuron>>> = number_by_layer
            .iter()
            .enumerate()
            .fold(Vec::new(), |acc: Vec<Vec<Box<Neuron>>>, (i, &n)| {
                let added_layer: Vec<Box<Neuron>> = (0..n)
                    .map(|j| {
                        let binding = WeightsAndBias { weights: vec![], bias: 0.0 };
                        let weights_and_bias = weights_and_biases
                            .as_deref()
                            .and_then(|w| w.get(i))
                            .and_then(|w| w.get(j))
                            .unwrap_or(&binding);

                        if i == 0 {
                            Box::new(InputNeuron {
                                execute: expr_parameters[j].clone(),
                                bias: Some(weights_and_bias.bias)
                                    .or_else(|| if random_init { Some(rng.gen()) } else { Some(0.0) })
                                    .unwrap(),
                            })
                        } else if i == number_by_layer.len() - 1 {
                            Box::new(OutputNeuron {
                                weights: acc[i - 1]
                                    .iter()
                                    .enumerate()
                                    .map(|(k, _)| {
                                        weights_and_bias.weights.get(k).cloned()
                                            .unwrap_or_else(
                                                || Link {
                                                    neuron: j,
                                                    number: if random_init { rng.gen() } else { 0_f64 }}
                                            )
                                    })
                                    .collect(),
                                bias: Some(weights_and_bias.bias)
                                    .or_else(|| if random_init { Some(rng.gen()) } else { Some(0.0) })
                                    .unwrap(),
                            })
                        } else {
                            Box::new(HiddenLayerNeuron {
                                weights: acc[i - 1]
                                    .iter()
                                    .enumerate()
                                    .map(|(k, _)| {
                                        weights_and_bias.weights.get(k).cloned()
                                            .unwrap_or_else(
                                                || Link {
                                                    neuron: j,
                                                    number: if random_init { rng.gen() } else { 0_f64 }}
                                            )
                                    })
                                    .collect(),
                                bias: Some(weights_and_bias.bias)
                                    .or_else(|| if random_init { Some(rng.gen()) } else { Some(0.0) })
                                    .unwrap(),
                            })
                        }
                    }).collect();
                    let mut result = acc;
                    result.push(added_layer);
                    result
            })
            .into_iter()
            .collect();

        let found_name = &name.unwrap_or_else(|| "anonymous network".to_string());
        let found_activation_function = &activation_function.unwrap_or_else(|| "sigmoid".to_string());
        let neural_network = Network {
            name: (*found_name).to_string(),
            neurons,
            mini_batch_length,
            activation_function: (*found_activation_function).to_string(),
            random_init,
        };

        if let Some(trainings) = trainings {
            if !trainings.inputs.is_empty() {
                let weights_and_biases = neural_network.train_with_gradient_descent(trainings).weights_and_biases;
                let trained_network = Network::new(
                    Some((*found_name).to_string()),
                    number_by_layer,
                    parameters,
                    Some(weights_and_biases),
                    None,
                    mini_batch_length,
                    Some((*found_activation_function).to_string()),
                    Some(random_init),
                );
                return Network {
                    name: (*found_name).to_string(),
                    neurons: trained_network.neurons,
                    mini_batch_length,
                    activation_function: (*found_activation_function).to_string(),
                    random_init,
                };
            }
        }

        neural_network
    }

    fn get_neurons_mut(&mut self) -> Vec<Vec<Box<Neuron>>> { 
        self.neurons.iter().map(|layer| {
            layer.iter().map(|neuron|
                Box::new((*neuron).clone())
            ).collect()
        }).collect()
    }
    fn get_neurons(&self) -> Vec<Vec<Box<Neuron>>> { 
        self.neurons.iter().map(|layer| {
            layer.iter().map(|neuron|
                Box::new((*neuron).clone())
            ).collect()
        }).collect()
    }

    fn clone(&self) -> Network {
        Network {
            name: format!("Trained from {}", self.name),
            neurons: self.get_neurons(),
            mini_batch_length: self.mini_batch_length,
            activation_function: self.activation_function.clone(),
            random_init: self.random_init,
        }
    }

    pub fn to_json(&self) -> serde_json::Value {
        let layers : Vec<serde_json::Value> = self.neurons.iter().map(|layer| {
            let layer_value: Vec<serde_json::Value> = 
            layer.iter().enumerate().map(|neuron| neuron.1.to_json()).collect(); 
        json!(layer_value)}).collect();
        json!({
            "type": "Network",
            "layers": layers })
    }

    pub fn to_string(&self) -> String {
        serde_json::to_string(&self.to_json()).unwrap()
    }


  fn process (&self, input: &Input) -> Vec<Vec<ProcessResult>> {
    let neurons = self.get_neurons();
    let processing_data = ProcessingData { input: input.clone(), saved_value: Vec::new() };
    neurons[1..].iter().fold(vec![neurons[0].iter().map(|n|ProcessResult { 
        neuron: 1,
        raw_value: n.process(processing_data.clone()),
        number: (activation_functions.get(&self.activation_function).unwrap().apply)(n.process(processing_data.clone()))
    }).collect()], 
    |acc, layer| {
        let mut result = acc.clone();
        let layer_result = layer.iter().map(
            |n|{
                let raw_value = n.process(ProcessingData::from(processing_data.clone(), acc.last().unwrap()));
                ProcessResult { 
                neuron: 1,
                raw_value: raw_value,
                number: (activation_functions.get(&self.activation_function).unwrap().apply)(n.process(processing_data.clone()))
            }}
        ).collect();
        result.push(layer_result);
        result
    })
}

    fn cost_summary_of(&mut self, training_data: TrainingDataset) -> CostSummary {
        let mut i = 0;
        let (inputs, theory) = 
            (training_data.inputs, training_data.theory);        

        let costs: Vec<f64> = inputs.iter().map(|input| {
            let process_result = self.process(input);
            let result = process_result.last().unwrap();
            let expected_result: Vec<f64> = if theory.is_empty() {   
            (|| {
                let result = training_data.expected_results.get(i).cloned().unwrap_or_default();
                i += 1;
                result
            })()
            } else { 
                theory.iter().map(|expr| expr.eval_with_context(&input.to_context()).unwrap().as_boolean().unwrap())
                .map(|predicate| if predicate { 1_f64 } else { 0_f64 })
                .collect()};
            result.iter().zip(expected_result.iter()).map(|(r, e)| (r.number - e).powi(2)).sum()
        }).collect();

        let average = costs.iter().sum::<f64>() / costs.len() as f64;
        CostSummary { costs, average }
    }

    fn partitions_of(&self, training_data: TrainingDataset) -> Vec<TrainingDataset> {
        if self.mini_batch_length.is_none() {
            return vec![training_data];
        }

        let mut associated_inputs_and_results: Vec<_> = training_data.inputs.iter().zip(training_data.expected_results.iter()).collect();
        associated_inputs_and_results.shuffle(&mut rand::thread_rng());

        let number_of_partitions = self.neurons.iter().map(|layer| layer.len()).sum::<usize>();
        let mini_batch_length = self.mini_batch_length.unwrap_or(associated_inputs_and_results.len());

        (0..number_of_partitions).map(|i| {
            let first = (associated_inputs_and_results.len() / number_of_partitions) * i;
            let last = usize::min(
                first + mini_batch_length,
                (associated_inputs_and_results.len() / number_of_partitions) * (i + 1) - 1
            );

            let inputs: Vec<Input> = associated_inputs_and_results[first..=last].iter().map(|(input, _)| (*input).clone()).collect();
            let expected_results: Vec<Vec<f64>> = associated_inputs_and_results[first..=last].iter().map(|(_, result)| (*result).clone()).collect();


            TrainingDataset {
                inputs,
                expected_results: expected_results.clone(),
                theory: training_data.theory.clone(),
                rounds: training_data.rounds
            }
        }).collect()
    }

    pub fn train_with_gradient_descent(&self, training_data: TrainingDataset) -> TrainingResult {
        fn adjust(owner: &mut dyn Adjustable, field_name: &str, mut render: impl FnMut() -> f64) -> f64 {
            let mut increment = 0.0000000002;
            let mut adjustment = 0.0;
            let mut last_adjustment = 0.0;

            while increment > 0.0000000001 {
                let actual_cost = render();
                owner.adjust_field(field_name, -increment);
                let left_new_cost = render();
                owner.adjust_field(field_name, increment * 2.0);
                let right_new_cost = render();
                owner.adjust_field(field_name, -increment);

                let direction = if left_new_cost < right_new_cost && left_new_cost < actual_cost {
                    -1.0
                } else if right_new_cost < left_new_cost && right_new_cost < actual_cost {
                    1.0
                } else if left_new_cost < right_new_cost && left_new_cost < actual_cost {
                    -1.0
                } else if right_new_cost < left_new_cost && right_new_cost < actual_cost {
                    1.0
                } else if left_new_cost < actual_cost {
                    -1.0
                } else if right_new_cost < actual_cost {
                    1.0
                } else {
                    0.0
                };

                owner.adjust_field(field_name, direction * increment);
                last_adjustment = adjustment;

                if adjustment + direction * increment == last_adjustment {
                    return adjustment + direction * increment;
                }

                adjustment += direction * increment;
                increment = if direction == 0.0 { increment / 2.0 } else { increment * 2.0 };
            }

            adjustment
        }

        let mut network_clone = Network::clone(&self);
        let rounds = training_data.rounds;
        let weights_and_biases: Vec<Vec<WeightsAndBias>> = (0..rounds)
            .fold(vec![], |_, round| {
                let training_partitions = self.partitions_of(training_data.clone());

                let mut iteration = 0;
                let mut render = |iteration: usize| (network_clone).cost_summary_of(
                    training_partitions[iteration % training_partitions.len()].clone()).average;
                let mut neurons = Network::clone(&self).get_neurons_mut();
                neurons
                    .iter_mut()
                    .rev()
                    .enumerate()
                    .map(|(i, layer)| {
                        layer.iter_mut().enumerate().map(|(j, neuron)| {
                            iteration += 1;

                            let mut weights = match neuron.clone() {
                                InputNeuron { execute: _, bias: _} => Vec::new(),
                                HiddenLayerNeuron { weights, bias: _ } => weights.clone(),
                                OutputNeuron { weights, bias: _ } => weights.clone(),
                            };
                            weights.iter_mut().for_each(|weight| {
                                    adjust(
                                        weight,
                                        "number",
                                        || render(iteration)
                                    );
                                });

                            let bias = adjust(
                                &mut **neuron,
                                "bias",
                                || render(iteration)
                            );

                            WeightsAndBias { weights, bias }
                        }).collect()
                    })
                    .collect()
            });

        let remaining_costs = network_clone.cost_summary_of(self.partitions_of(training_data)[0].clone());
        TrainingResult {
            weights_and_biases,
            remaining_cost: remaining_costs.average,
            remaining_cost_list: remaining_costs.costs,
            trained_network: network_clone
        }
    }
}

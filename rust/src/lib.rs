use std::str::FromStr;

use wasm_bindgen::prelude::*;
mod network;
use crate::network::*;

#[wasm_bindgen]
pub fn train_with_gradient_descent(
    parameters: Vec<String>,
    additional_layers: Vec<usize>,
    activation_function: String,
    training_size: usize, 
    theory: Vec<String>, 
    variables_amplitude: f64,
    rounds: usize,
    weights: Option<Vec<f64>>,
    biases: Option<Vec<f64>>) -> String {

    let mut number_by_layer = vec![parameters.len()];
    number_by_layer.extend(additional_layers);
    number_by_layer.push(1);
    let weights_content = &weights.unwrap_or_default();
    let biases_content = &biases.unwrap_or_default();
    let weights_and_biases: Option<Vec<Vec<WeightsAndBias>>> = if weights_content.is_empty() || biases_content.is_empty() {
        None
     } else {
        let mut biases_index = 0;
        let mut weights_index = 0;
        Some((0..number_by_layer.len()).map(|layer| (0..number_by_layer[layer])
        .map(|_index| {
            let number_of_weights = if layer == 0 { 0 } else { number_by_layer[layer - 1] };
            let result = WeightsAndBias {
                bias: biases_content[biases_index],
                weights: weights_content[weights_index..weights_index+number_of_weights].to_vec()
                .iter().enumerate().map(|(neuron, &number)| Link { neuron, number })
                .collect()
            };
            biases_index += 1;
            weights_index += number_of_weights;
            result
        })
        .collect()).collect())
    };
    let network = Network::new(
        Some(String::from_str("some_name").unwrap()),
            number_by_layer,
            parameters,
            weights_and_biases, 
            None, None, Some(activation_function), None
    );
    let dataset = TrainingDataset::new(
        training_size, 
        theory, 
        variables_amplitude, 
        rounds
    );
    let result = network.train_with_gradient_descent(dataset);
    result.to_string()
}

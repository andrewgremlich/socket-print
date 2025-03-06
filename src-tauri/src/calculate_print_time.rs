use std::f64;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct RawPoint {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[tauri::command]
pub fn calculate_print_time(levels_of_points: Vec<Vec<RawPoint>>) -> String {
    if levels_of_points.len() < 2 {
        return "0h 0m 0s".to_string();
    }

    let mut total_distance = 0.0;

    for i in 1..levels_of_points.len() {
        for j in 0..levels_of_points[i].len() {
            let point1 = &levels_of_points[i - 1][j];
            let point2 = &levels_of_points[i][j];

            let dx = point2.x - point1.x;
            let dy = point2.y - point1.y;
            let dz = point2.z - point1.z;

            total_distance += (dx * dx + dy * dy + dz * dz).sqrt();
        }
    }

    let average_speed = 20.0;
    let print_time = total_distance / average_speed;
    let rounded_print_time = print_time.ceil();

    let hours = (rounded_print_time / 60.0).floor();
    let minutes = (rounded_print_time % 60.0).floor();
    let estimated_print_time_string = format!("{}h {}m", hours, minutes);

    estimated_print_time_string
}

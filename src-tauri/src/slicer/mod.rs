mod geometry;

use std::f32::consts::PI;

use geometry::{RayCaster, Triangle, Vec3};

fn triangulate(input: Vec<f32>) -> Vec<Triangle> {
    let mut triangled: Vec<Triangle> = vec![];

    for i in (0..input.len()).step_by(9) {
        let triangle = Triangle::new(
            Vec3::new(input[i], input[i + 1], input[i + 2]),
            Vec3::new(input[i + 3], input[i + 4], input[i + 5]),
            Vec3::new(input[i + 6], input[i + 7], input[i + 8]),
        );

        triangled.push(triangle);
    }

    triangled
}

fn find_height(positions: Vec<f32>, vertical_axis: char) -> f32 {
    let mut max_height = f32::MIN;
    let mut min_height = f32::MAX;

    for i in (0..positions.len()).step_by(3) {
        let height = match vertical_axis {
            'x' => positions[i],
            'y' => positions[i + 1],
            'z' => positions[i + 2],
            _ => panic!("Invalid vertical axis"),
        };

        if height > max_height {
            max_height = height;
        }

        if height < min_height {
            min_height = height;
        }
    }

    println!("Lowest height: {}", min_height);
    max_height - min_height
}

#[tauri::command]
pub fn slicer(positions: &str, center: Vec<f32>) -> Vec<f32> {
    println!("Slicing...");
    println!("Positions: {:?}", positions);
    println!("Center: {:?}", center);

    let layer_height: f32 = 1.0;
    let segments: u8 = 128;
    let cup_size_height: f32 = 38.0 + 5.0;
    let angle_increment: f32 = (PI * 2.0) / segments as f32;
    let increment_height: bool = true;
    let vertical_axis: char = 'y';

    let positions_parsed: Vec<f32> =
        serde_json::from_str(&positions).expect("Invalid JSON format for positions");
    let triangled: Vec<Triangle> = triangulate(positions_parsed.clone());
    let mut intersections: Vec<f32> = vec![];
    let mut raycaster = RayCaster::new(
        Vec3::new(center[0], center[1], center[2]),
        Vec3::new(0.0, 0.0, -1.0),
    );
    let height = find_height(positions_parsed.clone(), vertical_axis);

    for triangle in triangled {
        let mut found_intersection = false;

        while !found_intersection {
            if let Some(intersection) = triangle.ray_intersection(&raycaster) {
                intersections.push(intersection.0.x);
                intersections.push(intersection.0.y + cup_size_height);
                intersections.push(intersection.0.z);
                found_intersection = true;
                break;
            } else {
                let height_change = if increment_height {
                    layer_height / angle_increment
                } else {
                    layer_height
                };
                raycaster.ray_rotate(angle_increment, height_change);
            }

            if raycaster.origin.z > height as f32 {
                break;
            }
        }
    }

    intersections
}

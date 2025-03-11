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

#[tauri::command]
pub fn slicer(positions: Vec<f32>, center: Vec<f32>) -> Vec<f32> {
    let layer_height: f32 = 1.0;
    let segments: u8 = 128;
    let cup_size_height: u8 = 38 + 5;
    let angle_increment: f32 = (PI * 2.0) / segments as f32;
    let increment_height: bool = true;
    let vertical_axis: char = 'y';

    let triangled: Vec<Triangle> = triangulate(positions);
    let mut intersections: Vec<f32> = vec![];
    let mut raycaster = RayCaster::new(
        Vec3::new(center[0], center[1], center[2]),
        Vec3::new(10.0, 0.0, 0.0),
    );

    for triangle in triangled {
        let mut found_intersection = false;

        while !found_intersection {
            if let Some(intersection) = triangle.ray_intersection(&raycaster) {
                intersections.push(intersection.0.x);
                intersections.push(intersection.0.y);
                intersections.push(intersection.0.z);
                found_intersection = true;
                break;
            } else {
                raycaster.ray_rotate(angle_increment, layer_height);
            }

            if raycaster.origin.z > cup_size_height as f32 {
                break;
            }
        }
    }

    intersections
}

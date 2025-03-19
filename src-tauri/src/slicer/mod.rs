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

fn find_height(positions: &Triangle) -> (f32, f32) {
    let max_height = positions.p1.y.max(positions.p2.y).max(positions.p3.y);
    let min_height = positions.p1.y.min(positions.p2.y).min(positions.p3.y);

    (min_height, max_height)
}

#[tauri::command]
pub fn slicer(positions: Vec<f32>, center: Vec<f32>) -> Vec<Vec<f32>> {
    let layer_height: f32 = 1.0;
    let segments: f32 = 128.0;
    let cup_size_height: f32 = 38.0 + 5.0;
    let angle_increment: f32 = (PI * 2.0) / segments;
    let height_change = layer_height / segments;
    let triangled: Vec<Triangle> = triangulate(positions.clone());
    let mut intersections: Vec<Vec<f32>> = vec![];

    // let mut raycasters: Vec<RayCaster> = vec![];
    // let mut exceeded_height = false;
    // let mut height = 0.0;

    // while !exceeded_height {
    //     let mut raycaster = RayCaster::new(
    //         Vec3::new(center[0], height, center[2]),
    //         Vec3::new(0.0, height, -1.0),
    //     );
    // }

    for triangle in triangled {
        let mut above_height = false;
        let triangle_height = find_height(&triangle);
        let mut raycaster = RayCaster::new(
            Vec3::new(center[0], triangle_height.0, center[2]),
            Vec3::new(0.0, 0.0, -1.0),
        );
        // https://crates.io/crates/bvh
        // https://chatgpt.com/c/67da34ed-15ac-800d-bbba-50f58151d318
        while !above_height {
            if let Some(intersection) = triangle.ray_intersection(&raycaster) {
                intersections.push(vec![
                    intersection.0.x,
                    intersection.0.y + cup_size_height,
                    intersection.0.z,
                ]);
                raycaster.ray_rotate(angle_increment, height_change);
                continue; // Skip to the next step in the while loop
            }

            raycaster.ray_rotate(angle_increment, height_change);

            if raycaster.origin.y > triangle_height.1 {
                above_height = true;
            }
        }
    }

    intersections
}

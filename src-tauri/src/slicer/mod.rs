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

fn find_height(positions: &Vec<Triangle>) -> f32 {
    let mut max_height = f32::MIN;

    for triangle in positions {
        let height = triangle.p1.y.max(triangle.p2.y).max(triangle.p3.y);

        if height > max_height {
            max_height = height;
        }
    }

    max_height
}

#[tauri::command]
pub fn slicer(positions: Vec<f32>, center: Vec<f32>) -> Vec<Vec<f32>> {
    let layer_height: f32 = 1.0;
    let segments: f32 = 128.0;
    let cup_size_height: f32 = 38.0 + 5.0;
    let angle_increment: f32 = (PI * 2.0) / segments;
    let height_change = layer_height / segments;

    println!("Layer Height: {:?}", layer_height);
    println!("Angle Increment: {:?}", angle_increment);
    println!("Height Change: {:?}", height_change);

    let triangled: Vec<Triangle> = triangulate(positions.clone());

    let test_triangles = triangled
        .iter()
        .take(10)
        .cloned()
        .collect::<Vec<Triangle>>();

    let mut intersections: Vec<Vec<f32>> = vec![];
    let mut raycaster = RayCaster::new(
        Vec3::new(center[0], 0.0, center[2]),
        Vec3::new(0.0, 0.0, -1.0),
    );
    let height = find_height(&test_triangles);

    for triangle in test_triangles {
        let mut above_height = false;

        while !above_height {
            if let Some(intersection) = triangle.ray_intersection(&raycaster) {
                intersections.push(vec![
                    intersection.0.x,
                    intersection.0.y + cup_size_height,
                    intersection.0.z,
                ]);
            }

            raycaster.ray_rotate(angle_increment, height_change);

            if raycaster.origin.y > height {
                raycaster.reset_raycaster(
                    Vec3::new(center[0], 0.0, center[2]),
                    Vec3::new(0.0, 0.0, -1.0),
                );
                above_height = true;
            }
        }
    }

    println!("Intersection found: {:?}", intersections);

    intersections
}

mod geometry;

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
pub fn slicer(
    positions: Vec<f32>,
    axis: char,
    bottom_height: f32,
    top_height: f32,
    radians_turn: f32,
    height_of_rotation: f32,
) -> Vec<f32> {
    let triangled: Vec<Triangle> = triangulate(positions);
    let mut intersections: Vec<f32> = vec![];
    let mut raycaster = RayCaster::new(Vec3::new(0.0, 0.0, 0.0), Vec3::new(10.0, 0.0, 0.0));

    raycaster.set_height(axis, bottom_height);

    for triangle in triangled {
        let mut found_intersection = false;

        while raycaster.origin.z <= top_height {
            if let Some(intersection) =
                triangle.ray_intersection(&raycaster.origin, &raycaster.direction)
            {
                intersections.push(intersection.0.x);
                intersections.push(intersection.0.y);
                intersections.push(intersection.0.z);
                found_intersection = true;
                break;
            } else {
                raycaster.ray_rotate(radians_turn, height_of_rotation);
            }
        }

        if !found_intersection {
            raycaster.set_height(axis, bottom_height);
        }
    }

    intersections
}

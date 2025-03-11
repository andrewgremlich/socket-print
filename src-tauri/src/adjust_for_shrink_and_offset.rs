use std::f64::consts::PI;
use std::sync::Arc;

#[derive(Clone, Copy, Debug)]
struct RawPoint {
    x: f64,
    y: f64,
    z: f64,
}

async fn get_nozzle_size() -> f64 {
    // Simulate database call
    0.4 // Example nozzle size
}

async fn get_active_material_profile() -> MaterialProfile {
    // Simulate fetching material profile
    MaterialProfile { shrink_factor: 2.0 } // Example shrink factor in percentage
}

#[derive(Debug)]
struct MaterialProfile {
    shrink_factor: f64,
}

pub async fn adjust_for_shrink_and_offset(
    points: Vec<Vec<RawPoint>>,
    center: RawPoint,
) -> Vec<Vec<RawPoint>> {
    let active_material_profile = get_active_material_profile().await;
    let nozzle_size = get_nozzle_size().await;
    let shrink_allowance = active_material_profile.shrink_factor;

    if nozzle_size == 0.0 || shrink_allowance == 0.0 {
        return points;
    }

    let mut adjusted_points = Vec::new();

    for layer in points.iter() {
        let mut adjusted_layer = Vec::new();
        for &pt in layer.iter() {
            let dx = pt.x - center.x;
            let dz = pt.z - center.z;

            let r = (dx * dx + dz * dz).sqrt();
            let theta = dz.atan2(dx);

            let mut adjusted_r = r + nozzle_size / 2.0;
            adjusted_r *= 1.0 - shrink_allowance / 100.0;

            adjusted_layer.push(RawPoint {
                x: center.x + adjusted_r * theta.cos(),
                y: pt.y,
                z: center.z + adjusted_r * theta.sin(),
            });
        }
        adjusted_points.push(adjusted_layer);
    }

    adjusted_points
}

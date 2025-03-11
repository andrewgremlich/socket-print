use nalgebra::Vector3;

#[derive(Debug, Clone, Copy)]
struct RawPoint {
    x: f64,
    y: f64,
    z: f64,
}

impl RawPoint {
    // Utility to calculate distance along the X-Z plane
    fn calculate_horizontal_distance(&self) -> f64 {
        let point = Vector3::new(self.x, self.y, self.z);
        point.distance(&Vector3::new(0.0, self.y, 0.0))
    }
}

fn get_point_at_distance(
    higher_point: RawPoint,
    lower_point: RawPoint,
    distance_to_change: f64,
) -> RawPoint {
    let dx = higher_point.x - lower_point.x;
    let dz = higher_point.z - lower_point.z;
    let distance = (dx * dx + dz * dz).sqrt();

    if distance == 0.0 {
        return lower_point;
    }

    let unit_x = dx / distance;
    let unit_z = dz / distance;

    RawPoint {
        x: higher_point.x - distance_to_change * unit_x,
        y: lower_point.y,
        z: higher_point.z - distance_to_change * unit_z,
    }
}

pub fn blend_merge(mut points: Vec<Vec<RawPoint>>, overlap_tolerance: f64) -> Vec<Vec<RawPoint>> {
    let levels_count = points.len();

    for i in (1..levels_count).rev() {
        let current_level = &points[i];
        let lower_level = &mut points[i - 1];

        for j in 0..current_level.len() {
            let current_point = current_level[j];
            let lower_point = lower_level[j];

            let distance_to_center_from_current_point =
                current_point.calculate_horizontal_distance();
            let distance_to_center_from_lower_point = lower_point.calculate_horizontal_distance();

            if distance_to_center_from_current_point - distance_to_center_from_lower_point
                > overlap_tolerance
            {
                let new_point =
                    get_point_at_distance(current_point, lower_point, overlap_tolerance / 2.0);
                lower_level[j] = new_point;
            }
        }
    }

    points
}

use std::f32::consts::PI;
use std::ops::{Add, Mul, Sub};

#[derive(Debug, Copy, Clone)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vec3 {
    pub fn new(x: f32, y: f32, z: f32) -> Self {
        Self { x, y, z }
    }

    fn dot(&self, other: &Vec3) -> f32 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }

    fn cross(&self, other: &Vec3) -> Vec3 {
        Vec3::new(
            self.y * other.z - self.z * other.y,
            self.z * other.x - self.x * other.z,
            self.x * other.y - self.y * other.x,
        )
    }

    pub fn scale(&self, factor: f32) -> Vec3 {
        Vec3::new(self.x * factor, self.y * factor, self.z * factor)
    }
}

impl Sub for Vec3 {
    type Output = Vec3;
    fn sub(self, other: Vec3) -> Vec3 {
        Vec3::new(self.x - other.x, self.y - other.y, self.z - other.z)
    }
}

impl Add for Vec3 {
    type Output = Vec3;
    fn add(self, other: Vec3) -> Vec3 {
        Vec3::new(self.x + other.x, self.y + other.y, self.z + other.z)
    }
}

impl Mul<f32> for Vec3 {
    type Output = Vec3;
    fn mul(self, scalar: f32) -> Vec3 {
        Vec3::new(self.x * scalar, self.y * scalar, self.z * scalar)
    }
}

#[derive(Debug, Copy, Clone)]

pub struct Triangle {
    pub p1: Vec3,
    pub p2: Vec3,
    pub p3: Vec3,
}

impl Triangle {
    pub fn new(p1: Vec3, p2: Vec3, p3: Vec3) -> Self {
        Self { p1, p2, p3 }
    }

    pub fn ray_intersection(&self, raycaster: &RayCaster) -> Option<(Vec3, f32)> {
        const EPSILON: f32 = 1e-6;

        let edge1 = self.p2 - self.p1;
        let edge2 = self.p3 - self.p1;

        let cross_direction_edge2 = raycaster.direction.cross(&edge2);
        let determinant = edge1.dot(&cross_direction_edge2);

        if determinant < EPSILON {
            return None; // Ray is parallel to the triangle or intersects from behind
        }

        let inverse_determinant = 1.0 / determinant;
        let origin_to_vertex = raycaster.origin - self.p1;
        let barycentric_u = inverse_determinant * origin_to_vertex.dot(&cross_direction_edge2);

        if barycentric_u < 0.0 || barycentric_u > 1.0 {
            return None;
        }

        let cross_origin_edge1 = origin_to_vertex.cross(&edge1);
        let barycentric_v = inverse_determinant * raycaster.direction.dot(&cross_origin_edge1);

        if barycentric_v < 0.0 || (barycentric_u + barycentric_v) > 1.0 {
            return None;
        }

        let ray_distance = inverse_determinant * edge2.dot(&cross_origin_edge1);

        if ray_distance > EPSILON {
            // Correctly calculate the intersection point
            let intersection_point = raycaster.origin + (raycaster.direction * ray_distance);
            Some((intersection_point, ray_distance))
        } else {
            None // Intersection is behind the ray origin
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct RayCaster {
    pub origin: Vec3,
    pub direction: Vec3,

    angle: f32,
    height: f32,
}

impl RayCaster {
    pub fn new(origin: Vec3, direction: Vec3) -> Self {
        Self {
            origin,
            direction,
            angle: 0.0,
            height: 0.0,
        }
    }

    pub fn ray_rotate(&mut self, angle: f32, height: f32) {
        self.angle += angle;
        self.height += height;

        let rotation_matrix = |angle: f32| -> (f32, f32) {
            let cos_angle = angle.cos();
            let sin_angle = angle.sin();
            (cos_angle, sin_angle)
        };

        let (cos_angle, sin_angle) = rotation_matrix(angle);

        self.direction = Vec3::new(
            self.direction.x * cos_angle - self.direction.z * sin_angle,
            self.direction.y,
            self.direction.x * sin_angle + self.direction.z * cos_angle,
        );

        self.origin.y += height;
    }

    pub fn reset_raycaster(&mut self, origin: Vec3, direction: Vec3) {
        self.origin = origin;
        self.direction = direction;
        self.angle = 0.0;
        self.height = 0.0;
    }
}

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
    p1: Vec3,
    p2: Vec3,
    p3: Vec3,
}

impl Triangle {
    pub fn new(p1: Vec3, p2: Vec3, p3: Vec3) -> Self {
        Self { p1, p2, p3 }
    }

    pub fn ray_intersection(&self, raycaster: &RayCaster) -> Option<(Vec3, f32)> {
        const EPSILON: f32 = 1e-6;

        let edge1 = self.p2 - self.p1;
        let edge2 = self.p3 - self.p1;

        let h = raycaster.direction.cross(&edge2);
        let a = edge1.dot(&h);

        if a.abs() < EPSILON {
            return None;
        }

        let f = 1.0 / a;
        let s = raycaster.origin - self.p1;
        let u = f * s.dot(&h);

        if u < 0.0 || u > 1.0 {
            return None;
        }
        let q = s.cross(&edge1);
        let v = f * raycaster.direction.dot(&q);

        if v < 0.0 || (u + v) > 1.0 {
            return None;
        }

        let t = f * edge2.dot(&q);

        if t > EPSILON {
            // Correctly calculate the intersection point
            let intersection_point = raycaster.origin + (raycaster.direction * t);
            Some((intersection_point, t))
        } else {
            None // Intersection is behind the ray origin
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct RayCaster {
    pub origin: Vec3,
    pub direction: Vec3,
}

impl RayCaster {
    pub fn new(origin: Vec3, direction: Vec3) -> Self {
        Self { origin, direction }
    }

    pub fn ray_rotate(&mut self, radians: f32, height: f32) {
        let (sin_angle, cos_angle) = radians.sin_cos();

        self.origin.z += height;

        self.direction = Vec3::new(
            self.direction.x * cos_angle - self.direction.y * sin_angle,
            self.direction.x * sin_angle + self.direction.y * cos_angle,
            self.direction.z,
        );
    }
}

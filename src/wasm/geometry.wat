(module
  (memory (export "memory") 1)
  
  ;; Calculate distance between two points
  (func $distance (export "distance") (param $x1 f32) (param $y1 f32) (param $x2 f32) (param $y2 f32) (result f32)
    (f32.sqrt
      (f32.add
        (f32.mul
          (f32.sub (local.get $x2) (local.get $x1))
          (f32.sub (local.get $x2) (local.get $x1))
        )
        (f32.mul
          (f32.sub (local.get $y2) (local.get $y1))
          (f32.sub (local.get $y2) (local.get $y1))
        )
      )
    )
  )
  
  ;; Check if point is inside rectangle
  (func $pointInRect (export "pointInRect") (param $px f32) (param $py f32) (param $x1 f32) (param $y1 f32) (param $x2 f32) (param $y2 f32) (result i32)
    (i32.and
      (i32.and
        (f32.ge (local.get $px) (f32.min (local.get $x1) (local.get $x2)))
        (f32.le (local.get $px) (f32.max (local.get $x1) (local.get $x2)))
      )
      (i32.and
        (f32.ge (local.get $py) (f32.min (local.get $y1) (local.get $y2)))
        (f32.le (local.get $py) (f32.max (local.get $y1) (local.get $y2)))
      )
    )
  )
)
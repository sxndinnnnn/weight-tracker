export type Unit = 'kg' | 'lb'
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'

export interface Profile {
  id: string
  start_weight_kg: number | null
  goal_weight_kg: number | null
  height_cm: number | null
  unit: Unit
  daily_calorie_target: number | null
  daily_water_target_ml: number
  start_date: string
}

export interface WeightEntry {
  id: string
  user_id: string
  entry_date: string
  weight_kg: number
  note: string | null
}

export interface FoodEntry {
  id: string
  user_id: string
  entry_date: string
  meal: Meal
  name: string
  calories: number | null
  eaten_at: string | null
  note: string | null
  created_at: string
}

export interface WaterEntry {
  id: string
  user_id: string
  entry_date: string
  ml: number
  created_at: string
}

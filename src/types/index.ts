export interface Task {
  id: string;
  content: string;
  completed: boolean;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DayColumn {
  date: string;
  tasks: Task[];
}

export interface WeekData {
  columns: DayColumn[];
}

export interface DateRange {
  start: string;
  end: string;
}

// API 响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: string[];
}

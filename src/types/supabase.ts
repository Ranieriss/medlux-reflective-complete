export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type GenericView = {
  Row: Record<string, unknown>;
  Relationships: [];
};

type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export interface Database {
  public: {
    Tables: Record<string, GenericTable>;
    Views: Record<string, GenericView>;
    Functions: Record<string, GenericFunction>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
}

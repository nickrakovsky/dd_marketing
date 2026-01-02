// src/utils/iconRegistry.ts
import { 
  Calendar, 
  Database, 
  BarChart3, 
  Users, 
  FileCheck, 
  Archive,
  // Import future icons here as you need them (e.g., Truck, Shield, Zap)
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Use a Record to map string keys to LucideIcon components
// We use 'string' for the key so types.ts doesn't need to know about specific icons
export const iconRegistry: Record<string, LucideIcon> = {
  calendar: Calendar,
  database: Database,
  barChart: BarChart3,
  users: Users,
  fileCheck: FileCheck,
  archive: Archive,
  // Add new mappings here:
  // truck: Truck,
};

export const getIcon = (iconName: string): LucideIcon => {
  // Returns the requested icon, or defaults to Calendar (or a generic 'HelpCircle') to prevent crashes
  return iconRegistry[iconName] || Calendar;
};
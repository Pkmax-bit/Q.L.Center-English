"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  options,
  disabled,
}: FormFieldProps) {
  if (type === "textarea") {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label} {required && <span className="text-destructive">*</span>}</Label>
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      </div>
    );
  }

  if (type === "select" && options) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label} {required && <span className="text-destructive">*</span>}</Label>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || `Chọn ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

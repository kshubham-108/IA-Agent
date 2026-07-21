"use client";

interface YearToggleProps {
  years: number[];
  rates: Record<number, number>;
  value: number;
  onChange: (year: number) => void;
  disabled?: boolean;
}

export function YearToggle({ years, rates, value, onChange, disabled }: YearToggleProps) {
  return (
    <div className="year-toggle" role="radiogroup" aria-label="Planning year">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          role="radio"
          aria-checked={value === year}
          className={`year-chip${value === year ? " selected" : ""}`}
          disabled={disabled}
          onClick={() => onChange(year)}
        >
          {year}
          <span className="pur"> £{rates[year]}/PU</span>
        </button>
      ))}
    </div>
  );
}

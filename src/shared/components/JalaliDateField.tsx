import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import "react-multi-date-picker/styles/colors/green.css";

export function JalaliDateField({
  value,
  onChange,
  inputClass,
  placeholder,
  id
}: {
  value: string;
  onChange: (isoGregorian: string) => void;
  inputClass?: string;
  placeholder?: string;
  id?: string;
}) {
  const persianValue = value
    ? new DateObject({
        date: value,
        format: "YYYY-MM-DD",
        calendar: gregorian,
        locale: gregorian_en
      }).convert(persian, persian_fa)
    : "";

  return (
    <DatePicker
      id={id}
      value={persianValue}
      onChange={(d: DateObject | null) => {
        if (!d) {
          onChange("");
          return;
        }
        onChange(d.convert(gregorian, gregorian_en).format("YYYY-MM-DD"));
      }}
      calendar={persian}
      locale={persian_fa}
      format="YYYY/MM/DD"
      inputClass={inputClass}
      containerClassName="w-full"
      placeholder={placeholder ?? "انتخاب تاریخ"}
      calendarPosition="bottom-right"
      className="bg-dark green"
      portal
      zIndex={9999}
      editable={false}
    />
  );
}

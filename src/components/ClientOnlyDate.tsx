import React from "react";

export function ClientOnlyDate({
  date,
  formatOptions = {},
  prefix = "",
}: {
  date: string | Date;
  formatOptions?: Intl.DateTimeFormatOptions;
  prefix?: string;
}) {
  const [formatted, setFormatted] = React.useState<string>("");

  React.useEffect(() => {
    const d = typeof date === "string" ? new Date(date) : date;
    setFormatted(new Intl.DateTimeFormat("en-US", formatOptions).format(d));
  }, [date, formatOptions]);

  return (
    <span>
      {prefix}
      {formatted}
    </span>
  );
}

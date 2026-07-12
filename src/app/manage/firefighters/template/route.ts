// Downloadable CSV template for the firefighter import.
export async function GET() {
  const csv = [
    "email,full_name",
    "jane.doe@example.com,Jane Doe",
    "john.smith@example.com,John Smith",
    "",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="firefighters-template.csv"',
    },
  });
}

export async function GET() {
  const csv = [
    "ACCREDITOR,STANDARD,CODE,EDITION,TITLE,DESCRIPTION",
    'NFPA,1001,4.1.1,2019,General Knowledge Requirements,"Understanding fire department organization, operational rules, and safety procedures."',
    'NFPA,1001,4.3.1,2019,Use self-contained breathing apparatus (SCBA),"Correctly identifying, inspecting, and donning an SCBA system."',
    "",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="standards-template.csv"',
    },
  });
}

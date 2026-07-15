export async function GET() {
  const csv = [
    "skill_number,subsection,title,nfpa_edition,jpr_code,jpr_designation,condition,time_limit,notes,authoring_entity",
    '10,,"Demonstrate donning Self-Contained Breathing Apparatus (SCBA)",2019,4.3.1,B,"Wearing full protective clothing and SCBA.",1:00,"Steps may vary with different SCBAs.",IFSTA',
    '11,A,"Conservation of air (skip breathing)",2019,4.3.1,B,"Wearing full protective clothing and SCBA.",1:00,,IFSTA',
    '11,B,"Emergency procedures - facepiece failure",2019,4.3.1,B,"Wearing full PPE, SCBA, simulated facepiece damage.",1:00,,IFSTA',
    "",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="skills.csv"',
    },
  });
}

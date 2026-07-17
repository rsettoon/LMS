export async function GET() {
  const csv = [
    "skill_number,subsection,title,condition,time_limit,notes,authoring_entity,standards",
    '10,,"Demonstrate donning Self-Contained Breathing Apparatus (SCBA)","Wearing full protective clothing and SCBA.",1:00,"Steps may vary with different SCBAs.",IFSTA,4.3.1',
    '11,A,"Conservation of air (skip breathing)","Wearing full protective clothing and SCBA.",1:00,,IFSTA,"4.2.4|4.3.5"',
    '11,B,"Emergency procedures - facepiece failure","Wearing full PPE, SCBA, simulated facepiece damage.",1:00,,IFSTA,4.3.5',
    "",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="skills.csv"',
    },
  });
}

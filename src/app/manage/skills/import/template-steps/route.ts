export async function GET() {
  const csv = [
    "skill_number,subsection,step_number,step_description",
    '10,,1,"Crouch or kneel at SCBA (if donned from ground)."',
    '10,,2,"Check SCBA cylinder pressure gauge (verbalize pressure)."',
    '10,,3,"Open cylinder valve fully."',
    '10,,4,"Check regulator and cylinder gauge - within 100 psi of each other."',
    '11,A,1,"Inhale normally (as during regular breathing)."',
    '11,A,2,"Hold breath (as long as it would take to exhale)."',
    '11,A,3,"Inhale again."',
    '11,A,4,"Exhale slowly."',
    '11,B,1,"Notify partner of problem."',
    '11,B,2,"Activate emergency communications (Mayday)."',
    "",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="skill-steps.csv"',
    },
  });
}

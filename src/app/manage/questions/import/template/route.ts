export async function GET() {
  const csv = [
    "question_type,prompt,option_a,option_b,option_c,option_d,correct,category,skills",
    'multiple_choice,"What should you verbalize when checking the cylinder?","The pressure","Your name","The time","The temperature",A,SCBA,10',
    'multiple_choice,"How far should the cylinder valve be opened?","Half way","Fully","One turn","Until it hisses",B,SCBA,10',
    'true_false,"The PASS device must be active before entry.",,,,,True,SCBA,"10|11B"',
    "",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="questions-template.csv"',
    },
  });
}

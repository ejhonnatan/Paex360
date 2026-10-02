export const FIELD_LABELS = {
  selfScore:"Autoevaluación", evidenceText:"Evidencia", improvementActions:"Acciones de mejora",
  tutorComments:"Comentarios de tutoría", certifierScore:"Evaluación de la certificadora",
  improvementPlan:"Plan de mejora",
  certifierObservations:"Observaciones de la certificadora"
};
const COLUMNS = {improvementPlan:"improvement_plan",selfScore:"self_score",evidenceText:"evidence_text",improvementActions:"improvement_actions",
  tutorComments:"tutor_comments",certifierScore:"certifier_score",certifierObservations:"certifier_observations"};
export function answerSnapshot(answer) {
  return Object.fromEntries(Object.keys(FIELD_LABELS).map(key => [key,answer[key] ?? (key.endsWith("Score") ? null : "")]));
}
export function savedAnswer(row) {
  return Object.fromEntries(Object.entries(COLUMNS).map(([key,column]) => [key,row[column] ?? (key.endsWith("Score") ? null : "")]));
}
export function changedFields(base, local) {
  return Object.keys(FIELD_LABELS).filter(key => local[key] !== base[key]);
}
export function reconcileRemote(base, local, remote) {
  const nextBase = {...base}, nextLocal = {...local};
  for(const key of Object.keys(FIELD_LABELS)) {
    if(local[key] === base[key] || local[key] === remote[key]) {
      nextBase[key] = remote[key]; nextLocal[key] = remote[key];
    }
  }
  return {base:nextBase,local:nextLocal};
}
export function reconcileSaved(sent, local, remote) {
  const nextLocal = {...local};
  for(const key of Object.keys(FIELD_LABELS)) if(local[key] === sent[key]) nextLocal[key] = remote[key];
  return {base:{...remote},local:nextLocal};
}

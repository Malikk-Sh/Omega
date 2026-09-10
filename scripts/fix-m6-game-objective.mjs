import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/app/Game.ts';
let text = await readFile(path, 'utf8');

const badStart = '      if (this.isSea2017Scene()) {\n      const physicalSeen = SEA_2017_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length;';
const badEnd = '    if (this.isBackup41Scene()) {\n        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup41.evidenceConsole) {';
const start = text.indexOf(badStart);
const end = text.indexOf(badEnd, start);
if (start < 0 || end < 0) throw new Error('Misplaced SEA objective block not found');
text = text.slice(0, start) + '      ' + text.slice(end);

const objectiveAnchor = '  private updateObjective(): void {\n    let objective: ObjectiveViewModel;\n';
if (!text.includes(objectiveAnchor)) throw new Error('updateObjective anchor not found');
const seaObjective = `    if (this.isSea2017Scene()) {\n      const physicalSeen = SEA_2017_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length;\n      const filesRead = Object.values(SEA_2017_INDEX_FILE_FLAG_BY_PATH).filter(flag => this.state.flags[flag] === true).length;\n      const aligned = Object.keys(parseSeaIndexAssignments(this.state)).length;\n      if (this.state.flags.m6_sea_vera_met !== true) objective = { code: "meet_sea_vera", title: "Поговори с V.E.R.A. у моря", detail: "Она узнаёт берег, на котором никогда физически не была. Сначала зафиксируй это противоречие." };\n      else if (!hasInspectedSea2017PhysicalEvidence(this.state)) objective = { code: "inspect_sea_errors", title: "Осмотри ошибки памяти", detail: "Осмотрено " + physicalSeen + "/4: looping wave, wrong shadow, faceless figures, incomplete footprints." };\n      else if (filesRead < SEA_2017_INDEX_FILES.length) objective = { code: "read_sea_index_files", title: "Прочитай cross-media index", detail: "Прочитано " + filesRead + "/4: camera, audio, tide и directory CREATE-order." };\n      else if (this.state.flags.m6_sea_index_solved !== true) objective = { code: "align_sea_index", title: "Выровняй пять каналов SEA INDEX", detail: "Выбрано " + aligned + "/5. Сопоставь дату, camera sequence, audio timestamp, tide marker и directory creation order." };\n      else if (this.state.flags.m6_final_archive_read !== true) objective = { code: "read_morr_final", title: "Прочитай финальный архив Морра", detail: "P12 смонтировал MORR FINAL. Прочитай sea_2017_final.msg целиком." };\n      else if (this.state.flags.m6_sea_truth_reconciled !== true) objective = { code: "reconcile_sea_truth", title: "Закрой OMEGA OS", detail: "V.E.R.A. должна сопоставить человеческий архив с собственной непрерывностью без forced-answer выбора." };\n      else objective = { code: "return_from_sea", title: "Вернись в HOME", detail: "Порог сохранит SEA INDEX и точный HOME return point." };\n      this.objectives.set(objective);\n      return;\n    }\n`;
text = text.replace(objectiveAnchor, objectiveAnchor + seaObjective);

await writeFile(path, text);

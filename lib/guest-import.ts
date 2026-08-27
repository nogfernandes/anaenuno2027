import { readSheet } from "read-excel-file/node";

type Cell=string|number|boolean|Date|null;
export type ImportedInvitation={code:string;language:'pt'|'en';guests:{name:string;category:'adult'|'child'|'baby'}[]};

function parseCsv(text:string){const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;for(let index=0;index<text.length;index++){const char=text[index];if(char==='"'){if(quoted&&text[index+1]==='"'){cell+='"';index++}else quoted=!quoted}else if(char===','&&!quoted){row.push(cell.trim());cell=''}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=char}row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows}
const cleanHeader=(value:Cell)=>String(value??'').trim().toLowerCase().replace(/[\s-]+/g,'_');
const cleanCategory=(value:Cell):'adult'|'child'|'baby'=>{const category=String(value??'adult').trim().toLowerCase();if(!['adult','child','baby'].includes(category))throw new Error(`Invalid guest type “${value}”. Use adult, child or baby.`);return category as 'adult'|'child'|'baby'};

export async function parseGuestImport(file:File):Promise<ImportedInvitation[]>{
  if(file.size===0)throw new Error('Choose a non-empty CSV or XLSX file.');if(file.size>2_000_000)throw new Error('The import file must be smaller than 2 MB.');
  const extension=file.name.toLowerCase().split('.').pop();let rows:Cell[][];
  if(extension==='csv')rows=parseCsv(await file.text());else if(extension==='xlsx')rows=await readSheet(Buffer.from(await file.arrayBuffer())) as Cell[][];else throw new Error('Use a .csv or .xlsx file.');
  if(rows.length<2)throw new Error('The file needs a header and at least one invitation row.');
  const headers=rows[0].map(cleanHeader);if(!headers.includes('language')||!headers.includes('guest_1'))throw new Error('Required columns: language and guest_1.');
  const column=(name:string)=>headers.indexOf(name);const imported:ImportedInvitation[]=[];
  for(let rowIndex=1;rowIndex<rows.length;rowIndex++){const source=rows[rowIndex];if(!source.some(value=>String(value??'').trim()))continue;const rawLanguage=String(source[column('language')]??'pt').trim().toLowerCase();if(!['pt','en'].includes(rawLanguage))throw new Error(`Row ${rowIndex+1}: language must be pt or en.`);const guests:ImportedInvitation['guests']=[];for(let guestIndex=1;guestIndex<=5;guestIndex++){const nameColumn=column(`guest_${guestIndex}`);if(nameColumn<0)continue;const name=String(source[nameColumn]??'').trim();if(!name)continue;const typeColumn=column(`guest_${guestIndex}_type`);guests.push({name:name.slice(0,150),category:cleanCategory(typeColumn>=0?source[typeColumn]:'adult')})}if(!guests.length)throw new Error(`Row ${rowIndex+1}: add at least one guest.`);imported.push({code:`ANA-NUNO-2027-${crypto.randomUUID().slice(0,6).toUpperCase()}`,language:rawLanguage as 'pt'|'en',guests})}
  if(!imported.length)throw new Error('The file has no invitation rows.');return imported;
}

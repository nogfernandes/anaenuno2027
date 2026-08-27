export type Language = "pt" | "en";
export type Attendance = "pending" | "accepted" | "declined";
export type GuestCategory = "adult" | "child" | "baby";
export interface Guest { id:string; name:string; category:GuestCategory; attendance:Attendance; dietary_restrictions:string | null; notes:string | null; }
export type QuestionType="short_text"|"long_text"|"single_choice"|"multiple_choice"|"yes_no";
export interface QuestionOption { label_pt:string;label_en:string;value:string; }
export interface RsvpQuestion { id:string;label_pt:string;label_en:string;help_pt:string|null;help_en:string|null;question_type:QuestionType;scope:"invitation"|"guest";options:QuestionOption[];required:boolean;position:number; }
export interface RsvpAnswer { question_id:string;guest_id:string|null;answer:string|string[]|boolean; }
export interface Invitation { id:string; code:string; language:Language; max_guests:number; status:"active"|"used"|"disabled"; guests:Guest[];questions:RsvpQuestion[];answers:RsvpAnswer[]; }
export interface WeddingSettings { rsvp_open:boolean; rsvp_deadline:string; show_faq:boolean; show_dress_code:boolean; show_playlist:boolean; show_programme:boolean; }

export type Language = "pt" | "en";
export type Attendance = "pending" | "accepted" | "declined";
export type GuestCategory = "adult" | "child" | "baby";
export interface Guest { id:string; name:string; category:GuestCategory; attendance:Attendance; dietary_restrictions:string | null; notes:string | null; }
export interface Invitation { id:string; code:string; language:Language; max_guests:number; status:"active"|"used"|"disabled"; guests:Guest[]; }
export interface WeddingSettings { rsvp_open:boolean; rsvp_deadline:string; show_faq:boolean; show_dress_code:boolean; show_playlist:boolean; show_programme:boolean; }

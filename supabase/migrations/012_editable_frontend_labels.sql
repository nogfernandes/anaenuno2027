alter table public.site_content
  add column if not exists ui_copy jsonb not null default '{}'::jsonb;

update public.site_content
set ui_copy = coalesce(ui_copy, '{}'::jsonb) || jsonb_build_object(
  'couple_name_pt','Ana + Nuno','couple_name_en','Ana + Nuno',
  'header_monogram_pt','A + N','header_monogram_en','A + N',
  'hero_kicker_pt','Together','hero_kicker_en','Together',
  'story_nav_pt','História','story_nav_en','Story',
  'story_section_label_pt','01 · Nós','story_section_label_en','01 · Us',
  'countdown_label_pt','Até estarmos juntos','countdown_label_en','Until we are together',
  'days_label_pt','dias','days_label_en','days',
  'hours_label_pt','horas','hours_label_en','hours',
  'minutes_label_pt','minutos','minutes_label_en','minutes',
  'seconds_label_pt','segundos','seconds_label_en','seconds',
  'programme_nav_pt','Programa','programme_nav_en','Programme',
  'programme_section_label_pt','02 · O dia','programme_section_label_en','02 · The day',
  'dress_nav_pt','Dress code','dress_nav_en','Dress code',
  'dress_section_label_pt','03 · Código de vestuário','dress_section_label_en','03 · Dress code',
  'faq_nav_pt','FAQ','faq_nav_en','FAQ',
  'faq_section_label_pt','04 · FAQ','faq_section_label_en','04 · FAQ',
  'faq_title_pt','Algumas notas','faq_title_en','A few notes'
) || jsonb_build_object(
  'rsvp_nav_pt','RSVP','rsvp_nav_en','RSVP',
  'rsvp_section_label_pt','05 · RSVP','rsvp_section_label_en','05 · RSVP',
  'rsvp_title_pt','Confirmar presença','rsvp_title_en','RSVP',
  'rsvp_closed_pt','As respostas estão encerradas.','rsvp_closed_en','Responses are now closed.',
  'playlist_section_label_pt','Música','playlist_section_label_en','Playlist',
  'playlist_title_pt','Sugestões para a pista','playlist_title_en','Songs for the dance floor',
  'playlist_empty_pt','Ainda não há sugestões musicais.','playlist_empty_en','There are no music suggestions yet.',
  'pre_event_section_label_pt','Cartório','pre_event_section_label_en','Registry office',
  'pre_event_when_label_pt','Quando','pre_event_when_label_en','When',
  'pre_event_where_label_pt','Onde','pre_event_where_label_en','Where',
  'pre_event_rsvp_label_pt','RSVP · 18.10.2026','pre_event_rsvp_label_en','RSVP · 18.10.2026',
  'pre_event_closed_pt','As respostas do pré-evento estão encerradas.','pre_event_closed_en','Pre-event responses are now closed.'
) || jsonb_build_object(
  'footer_brand_pt','Ana + Nuno','footer_brand_en','Ana + Nuno',
  'admin_sign_in_pt','Acesso de administração','admin_sign_in_en','Admin sign in',
  'map_link_pt','Ver mapa ↗','map_link_en','View map ↗',
  'invitation_code_label_pt','Código do convite','invitation_code_label_en','Invitation code',
  'code_error_pt','Confirma o código e tenta novamente.','code_error_en','Check the code and try again.',
  'continue_button_pt','Continuar','continue_button_en','Continue',
  'back_brand_pt','← Ana + Nuno','back_brand_en','← Ana + Nuno',
  'missing_code_title_pt','Falta o código','missing_code_title_en','Invitation code needed',
  'enter_code_button_pt','Introduzir código','enter_code_button_en','Enter code',
  'opening_invitation_pt','A abrir o convite…','opening_invitation_en','Opening your invitation…',
  'invalid_invitation_pt','Não encontrámos este convite. Confirma o código.','invalid_invitation_en','We could not find this invitation. Check the code.',
  'go_back_button_pt','Voltar','go_back_button_en','Go back',
  'invitation_heading_pt','O vosso convite','invitation_heading_en','Your invitation',
  'accept_label_pt','Aceito','accept_label_en','Accept',
  'decline_label_pt','Não poderei ir','decline_label_en','Decline'
) || jsonb_build_object(
  'dietary_placeholder_pt','Restrições alimentares (opcional)','dietary_placeholder_en','Dietary restrictions (optional)',
  'questions_heading_pt','Algumas perguntas','questions_heading_en','A few questions',
  'yes_label_pt','Sim','yes_label_en','Yes',
  'no_label_pt','Não','no_label_en','No',
  'suggestion_label_pt','Sugestão','suggestion_label_en','Suggestion',
  'song_placeholder_pt','Música','song_placeholder_en','Song',
  'artist_placeholder_pt','Artista','artist_placeholder_en','Artist',
  'remove_suggestion_pt','Remover sugestão','remove_suggestion_en','Remove suggestion',
  'add_song_button_pt','Adicionar outra música +','add_song_button_en','Add another song +',
  'required_error_pt','Responde a todas as perguntas obrigatórias.','required_error_en','Please answer every required question.',
  'save_error_pt','Não foi possível guardar. Verifica os campos obrigatórios e tenta novamente.','save_error_en','We could not save your reply. Check the required fields and try again.',
  'send_reply_button_pt','Enviar resposta','send_reply_button_en','Send reply',
  'thank_you_title_pt','Obrigado','thank_you_title_en','Thank you',
  'thank_you_message_pt','A tua resposta já está connosco.','thank_you_message_en','Your reply is safely with us.',
  'back_home_button_pt','Voltar ao início','back_home_button_en','Back home'
), updated_at=now()
where id=1;

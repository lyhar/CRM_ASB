export type EmailTemplate = { sujet: string; html: string }

export const DEFAULT_TEMPLATES = {
  suivi: {
    label: 'Suivi 1 an après livraison',
    sujet: '{{prenom}}, comment se passe votre {{vehicule}} ?',
    html: `<p>Bonjour {{prenom}},</p>
<p>Cela fait maintenant un an que vous avez récupéré votre <strong>{{vehicule}}</strong> — le temps passe vite !</p>
<p>Je souhaitais prendre de vos nouvelles et vérifier quelques points :</p>
<ul>
  <li>Votre contrat kilométrique est-il toujours adapté à votre usage ?</li>
  <li>Avez-vous des questions sur votre contrat {{financement}} ?</li>
  <li>Tout se passe bien avec la concession ?</li>
</ul>
<p>N'hésitez pas à me contacter pour tout renseignement, je reste disponible pour vous accompagner.</p>
<p>Bien cordialement,</p>`
  },
  relance6mois: {
    label: 'Relance 6 mois avant fin de contrat',
    sujet: 'Votre contrat {{vehicule}} arrive à échéance dans 6 mois',
    html: `<p>Bonjour {{prenom}},</p>
<p>Votre contrat {{financement}} sur votre <strong>{{vehicule}}</strong> arrive à échéance dans environ <strong>6 mois</strong> (prévu le {{dateFinContrat}}).</p>
<p>C'est le bon moment pour commencer à réfléchir à votre prochain véhicule !</p>
<p>Je serais ravi de vous préparer des propositions adaptées à vos besoins :</p>
<ul>
  <li>Renouvellement sur un modèle similaire ou supérieur</li>
  <li>Simulation de loyer sur les dernières nouveautés</li>
  <li>Possibilité de restitution anticipée si besoin</li>
</ul>
<p>Contactez-moi pour qu'on en discute, je reste à votre disposition.</p>
<p>Bien cordialement,</p>`
  },
  relance3mois: {
    label: 'Relance restitution 3 mois avant fin',
    sujet: 'Restitution de votre {{vehicule}} — dans 3 mois ({{dateFinContrat}})',
    html: `<p>Bonjour {{prenom}},</p>
<p>Votre contrat {{financement}} arrive à échéance dans <strong>3 mois</strong> (le {{dateFinContrat}}).</p>
<p>Afin d'éviter toute pénalité lors de la restitution de votre <strong>{{vehicule}}</strong>, voici les points à vérifier :</p>
<ul>
  <li>✔ <strong>État général</strong> : carrosserie sans chocs ni rayures anormaux, jantes en bon état</li>
  <li>✔ <strong>Révision à jour</strong> : carnet d'entretien tamponné</li>
  <li>✔ <strong>Pneumatiques</strong> : usure homogène, gonflage correct</li>
  <li>✔ <strong>Double des clés</strong> : les deux jeux de clés doivent être restitués</li>
  <li>✔ <strong>Documents de bord</strong> : carte grise, carnet d'entretien</li>
</ul>
<p>Je vous invite à <strong>prendre rendez-vous rapidement avec la concession</strong> pour organiser la restitution.</p>
<p>Et si vous souhaitez préparer votre prochain véhicule, je suis disponible pour vous accompagner dès maintenant.</p>
<p>Bien cordialement,</p>`
  }
}

function buildVars(d: any): Record<string, string> {
  return {
    prenom: d.clientPrenom || 'Madame, Monsieur',
    vehicule: [d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || 'votre véhicule',
    financement: d.typeFinancement === 'LLD' ? 'LLD' : d.typeFinancement === 'LOA' ? 'LOA' : 'financement',
    dateFinContrat: d.dateFinContrat
      ? new Date(d.dateFinContrat).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'bientôt',
    concessionnaire: d.concessionnaire || '',
  }
}

function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

function wrapHtml(content: string, signature: string, imgUrl = ''): string {
  const hasSig = signature || imgUrl
  const sigBlock = hasSig
    ? `<br><hr style="border:none;border-top:1px solid #eee;margin:16px 0;"><div style="color:#666;font-size:13px;">${imgUrl ? `<img src="${imgUrl}" style="max-height:80px;display:block;margin-bottom:8px;" />` : ''}${signature}</div>`
    : ''
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">\n${content}\n${sigBlock}\n</div>`
}

export function renderTemplate(sujet: string, html: string, vars: Record<string, string>, signature: string, imgUrl = ''): EmailTemplate {
  return {
    sujet: substitute(sujet, vars),
    html: wrapHtml(substitute(html, vars), signature, imgUrl)
  }
}

export function templateSuiviAnnuel(d: any, signature = '', imgUrl = '', customSujet?: string, customHtml?: string): EmailTemplate {
  return renderTemplate(
    customSujet ?? DEFAULT_TEMPLATES.suivi.sujet,
    customHtml ?? DEFAULT_TEMPLATES.suivi.html,
    buildVars(d), signature, imgUrl
  )
}

export function templateRelance6Mois(d: any, signature = '', imgUrl = '', customSujet?: string, customHtml?: string): EmailTemplate {
  return renderTemplate(
    customSujet ?? DEFAULT_TEMPLATES.relance6mois.sujet,
    customHtml ?? DEFAULT_TEMPLATES.relance6mois.html,
    buildVars(d), signature, imgUrl
  )
}

export function templateRelance3Mois(d: any, signature = '', imgUrl = '', customSujet?: string, customHtml?: string): EmailTemplate {
  return renderTemplate(
    customSujet ?? DEFAULT_TEMPLATES.relance3mois.sujet,
    customHtml ?? DEFAULT_TEMPLATES.relance3mois.html,
    buildVars(d), signature, imgUrl
  )
}

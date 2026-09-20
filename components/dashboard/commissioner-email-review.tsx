import { ExternalLink, Link2, MailSearch, ShieldCheck } from 'lucide-react';
import emailData from '@/data/public-email.json';

export function CommissionerEmailReview({ commissioner, district }: { commissioner: string; district?: string }) {
  const mailbox = emailData.mailboxes.find((item) => item.commissioner === commissioner);
  const validationCases = emailData.validationCases.filter((item) => item.commissioner === commissioner);

  return (
    <div className="commissioner-email-review">
      <div className="disclaimer">
        <ShieldCheck size={19} />
        <div>
          <strong>A review flag is not a legal conclusion.</strong>
          <span>{emailData.meta.disclaimer}</span>
        </div>
      </div>

      <div className="email-review-summary">
        <div>
          <span className="section-kicker">DISTRICT {district ?? '?'} MAILBOX</span>
          <h3>{commissioner}</h3>
          <p>{mailbox?.reviewedMessages ?? 0} messages reviewed · {mailbox?.flaggedMessages ?? 0} retained for human review</p>
        </div>
        <a className="source-link" href={emailData.meta.sourceUrl} target="_blank" rel="noreferrer">
          Open official mailbox <ExternalLink size={12} />
        </a>
      </div>

      <section className="panel email-charter-card">
        <div className="panel-head">
          <div><span className="section-kicker">CHARTER §2.2.J</span><h3>What the review is testing</h3></div>
          <a className="source-link" href={emailData.meta.charterUrl} target="_blank" rel="noreferrer">Official charter <ExternalLink size={12}/></a>
        </div>
        <p>Commissioners may seek inquiry or information. The review queue looks for possible directions to, or interference with, employees, officers, or agents under the direct or indirect supervision of the County Manager, County Attorney, or Commission Auditor. Citizen referrals to those officials are treated separately.</p>
      </section>

      <div className="email-signal-grid">
        {emailData.signals.map((signal) => (
          <article className="research-card" key={signal.id}>
            <span>{signal.label}</span>
            {signal.examples.length > 0 && <p className="signal-examples">Examples: {signal.examples.join(' · ')}</p>}
            <p>{signal.effect}</p>
          </article>
        ))}
      </div>

      <section className="panel review-workflow">
        <div className="panel-head"><div><span className="section-kicker">ALLOWED RESULTS</span><h3>Same classifications for every commissioner</h3></div></div>
        {emailData.reviewStates.slice(0, 4).map((state) => <article key={state.id}><strong>{state.label}</strong><p>{state.meaning}</p></article>)}
      </section>

      {validationCases.length > 0 && (
        <section className="panel validation-cases">
          <div className="panel-head"><div><span className="section-kicker">VALIDATION SET</span><h3>Manual examples awaiting complete threads</h3></div></div>
          {validationCases.map((item) => <article key={item.label}><MailSearch size={17}/><div><strong>{item.label}</strong><p>{item.note}</p><span className="pending-value">Complete thread required</span></div></article>)}
        </section>
      )}

      <section className="panel email-crossref">
        <Link2 size={18}/><div><strong>Contracts and project cross-reference</strong><p>When a reviewed message names a vendor, consultant, development, contract number, Public Safety project, stormwater project, or another tracked entity, it can link to that record as a possible connection. A name match alone is never evidence of wrongdoing.</p></div>
      </section>
    </div>
  );
}

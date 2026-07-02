import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import UtilizationRing from '../components/UtilizationRing'
import { CardIcon, ChartIcon, HomeIcon, ListIcon, LogoIcon, RepeatIcon } from '../components/icons'
import { formatCurrency, utilizationLevel, utilizationMessages } from '../utils/format'

const features = [
  {
    icon: ListIcon,
    color: '#f59e0b',
    title: 'Transaction tracking',
    text: 'Log income and expenses across checking, savings, and credit cards. Every dollar gets a category, so nothing disappears into "misc."',
  },
  {
    icon: ChartIcon,
    color: '#8b5cf6',
    title: 'Budgets that talk back',
    text: 'Set a monthly limit per category and watch the bar fill up. Amber at 80%, red when you blow past it — no spreadsheet required.',
  },
  {
    icon: CardIcon,
    color: '#10b981',
    title: 'Credit utilization calculator',
    text: 'See exactly what percentage of your limit you are using and where that puts you, from excellent (under 10%) to risky (over 30%).',
  },
  {
    icon: RepeatIcon,
    color: '#3b82f6',
    title: 'What-if credit simulator',
    text: 'Test a purchase or a payment before you make it. Know how a $300 swipe changes your utilization while it is still hypothetical.',
  },
  {
    icon: HomeIcon,
    color: '#ec4899',
    title: 'Insights written for beginners',
    text: 'Plain-English nudges like "Food is your top category this month" or "Your subscriptions total $59/month" — not a wall of charts.',
  },
]

const audiences = [
  {
    title: 'College students',
    text: 'Rent, meal plans, textbooks, and a part-time paycheck that never feels like enough. CPFT shows where it actually goes.',
  },
  {
    title: 'First credit card holders',
    text: 'Nobody explains utilization until it has already dinged your score. Learn how your card works before the lesson gets expensive.',
  },
  {
    title: 'Interns & new grads',
    text: 'First real income, first real bills. Build the budgeting habit now, while the stakes are still small.',
  },
]

const DEMO_LIMIT = 1500

export default function Landing() {
  const [demoBalance, setDemoBalance] = useState(400)
  const demoRatio = demoBalance / DEMO_LIMIT

  // Reveal-on-scroll: adds .in when an element enters the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-mark">
            <LogoIcon />
          </div>
          <div>
            CPFT
            <small>Personal Finances</small>
          </div>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-ghost">
            Log In
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="orb orb-a" aria-hidden="true" />
        <div className="orb orb-b" aria-hidden="true" />
        <div className="hero-enter">
          <h1>
            Your money and your credit score,{' '}
            <span className="accent-text">finally making sense.</span>
          </h1>
          <p>
            CPFT (College Personal Finances Tracker) is a dashboard for students and
            first-time credit card users. Track what you spend, set budgets you can
            actually keep, and see how every swipe moves your credit utilization —
            before it shows up on your score.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Create a free account
            </Link>
            <Link to="/login" className="btn btn-ghost">
              I already have one
            </Link>
          </div>
          <div className="hero-note">No bank connection required — add transactions manually or by CSV.</div>
        </div>

        <div className="hero-demo hero-enter" style={{ animationDelay: '0.25s' }}>
          <div className="demo-card demo-float">
            <h3>Try it: the utilization calculator</h3>
            <div className="demo-sub">
              Drag to change your card balance on a {formatCurrency(DEMO_LIMIT)} limit.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <UtilizationRing ratio={demoRatio} size={148} />
            </div>
            <input
              className="demo-slider"
              type="range"
              min="0"
              max={DEMO_LIMIT}
              step="10"
              value={demoBalance}
              onChange={(e) => setDemoBalance(Number(e.target.value))}
              aria-label="Card balance"
            />
            <div className="demo-readout">
              <span>Balance: {formatCurrency(demoBalance)}</span>
              <span>Limit: {formatCurrency(DEMO_LIMIT)}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
              {utilizationMessages[utilizationLevel(demoRatio)]}
            </p>
          </div>
        </div>
      </header>

      <section className="landing-section reveal">
        <h2>The problem, in one sentence</h2>
        <p>
          Most finance apps are built for people with mortgages — and most students
          learn how credit utilization works only after it has hurt their score. CPFT
          covers the two things that matter at this stage: where your money goes, and
          what your credit card is doing behind your back.
        </p>
        <div className="feature-grid">
          {features.map(({ icon: Icon, color, title, text }, i) => (
            <div className="feature-card reveal" style={{ transitionDelay: `${i * 90}ms` }} key={title}>
              <div className="feature-icon" style={{ background: `${color}22`, color }}>
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-light">
        <div className="landing-section reveal">
          <h2>Built for people just getting started</h2>
          <p>
            You do not need an investment portfolio to take your finances seriously.
            CPFT is for the money you have now.
          </p>
          <div className="audience-grid">
            {audiences.map(({ title, text }, i) => (
              <div className="audience-card reveal" style={{ transitionDelay: `${i * 110}ms` }} key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta reveal">
        <h2>Five minutes to set up. Free while you are broke.</h2>
        <p style={{ margin: '8px auto 0' }}>
          Add an account, set a couple of budgets, and see your credit picture today.
        </p>
        <Link to="/signup" className="btn btn-primary">
          Sign up with your email
        </Link>
      </section>

      <footer className="landing-footer">
        <span>CPFT — College Personal Finances Tracker</span>
        <span>Educational tool, not financial advice.</span>
      </footer>
    </div>
  )
}

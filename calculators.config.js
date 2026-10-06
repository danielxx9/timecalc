/**
 * Configuration for each calculator landing page.
 * `slug` becomes the URL path. `calcId` must match the id in script.js.
 */
module.exports = {
  domain: 'https://timecalc.example.com',

  calculators: [
    {
      slug: 'time-duration',
      calcId: 'duration',
      title: 'Time Duration Calculator — Hours Between Two Times',
      description: 'Free time duration calculator. Work out the elapsed hours and minutes between any two times or dates, including overnight shifts. No sign-up.',
      h1: 'Time Duration Calculator',
      lede: 'Work out the exact elapsed time between two moments. Handles overnight shifts, multi-day spans, and lap times.',
      intro: `<p>This calculator subtracts a start time from an end time and returns the elapsed duration in hours, minutes, and seconds. It automatically detects overnight shifts when the end time is earlier than the start.</p>
<p>Use it for time tracking, travel planning, event scheduling, or any situation where you need to know how long something lasts. The result panel shows the duration in several formats at once: human-readable, decimal hours, total minutes, and total seconds.</p>`,
      faq: [
        { q: 'Does it handle times that cross midnight?', a: 'Yes. If the end time is earlier than the start time on the same date, one day is added automatically. If you provide an explicit later end date, the actual calendar difference is used.' },
        { q: 'Can I include lap times?', a: 'Yes. Add as many intermediate waypoints as you need in the "Lap / waypoint times" section.' },
        { q: 'What is decimal hours?', a: 'Decimal hours express a duration as a single number. For example, 8 hours 30 minutes is 8.5 decimal hours. Payroll systems often use this format.' }
      ]
    },

    {
      slug: 'work-hours',
      calcId: 'work-hours',
      title: 'Work Hours Calculator — Net Working Time After Breaks',
      description: 'Calculate your net working hours after paid and unpaid breaks. Free online work hours calculator for employees, shift workers, and payroll.',
      h1: 'Work Hours Calculator',
      lede: 'Calculate your net working time after paid and unpaid breaks. Ideal for hourly employees, shift workers, and payroll preparation.',
      intro: `<p>Enter your clock-in time, clock-out time, and any breaks. The calculator subtracts the break time from the gross shift duration to produce your net working time.</p>
<p>Paid breaks count as working time; unpaid breaks do not. If your employer rounds hours, use the Rounding calculator separately. The result panel shows gross shift, total breaks, paid and unpaid split, net working time, and decimal hours.</p>`,
      faq: [
        { q: 'What counts as a paid break?', a: 'A paid break is time off that still counts as working time. Many employers pay for short breaks of 5–20 minutes but not for a lunch hour.' },
        { q: 'Can I add multiple breaks?', a: 'Yes. Add as many breaks as your shift includes. Each one can be marked paid or unpaid.' },
        { q: 'Does the calculator handle overnight shifts?', a: 'Yes. Enable "Detect overnight" and the calculator adds 24 hours when the clock-out is earlier than the clock-in.' }
      ]
    },

    {
      slug: 'timesheet',
      calcId: 'timesheet',
      title: 'Timesheet Calculator — Track Hours, Billable Time & Earnings',
      description: 'Free online timesheet calculator. Track work periods, billable and non-billable hours, and estimated earnings with client and project fields.',
      h1: 'Timesheet Calculator',
      lede: 'Track every work period, mark which hours are billable, and see your total earnings. Exports directly to CSV.',
      intro: `<p>Add one row for each work period. Each row supports a date, client, project, task, start and end times, break duration, billable toggle, and hourly rate. The calculator totals hours per day and per week.</p>
<p>Billable hours and non-billable hours are tracked separately, along with a billable percentage and total estimated earnings. You can export the full sheet as CSV or JSON.</p>`,
      faq: [
        { q: 'Can I export to Excel?', a: 'Yes. Click Export CSV and open the file in Excel, Google Sheets, or Numbers.' },
        { q: 'How does overtime work?', a: 'Set the "Overtime after" field to your daily threshold (typically 8 hours). Hours above that amount on any single day are counted as overtime.' },
        { q: 'Is the earnings figure accurate?', a: 'It is a pre-tax estimate based on the rate you enter. Tax, deductions, and any payroll adjustments are not included.' }
      ]
    },

    {
      slug: 'multiple-intervals',
      calcId: 'multi-interval',
      title: 'Multiple Time Intervals Calculator — Add Periods & Detect Overlaps',
      description: 'Add several time periods together, detect overlapping intervals and idle gaps. Free online interval calculator.',
      h1: 'Multiple Time Intervals Calculator',
      lede: 'Add several time periods together, detect overlaps and duplicates, and see total idle time between intervals.',
      intro: `<p>Enter any number of intervals as start and end times within a single day. The calculator sums them all, sorts them, and highlights any overlaps or duplicates.</p>
<p>It also shows the total idle time between intervals — useful for tracking how much of a work day was actually spent on tasks. Merge overlapping intervals or account for short gaps with the tolerance setting.</p>`,
      faq: [
        { q: 'Can I merge overlapping intervals?', a: 'Yes. Enable "Merge overlaps" and the calculator combines adjacent or overlapping intervals before totalling.' },
        { q: 'What is gap tolerance?', a: 'If two intervals are separated by less than the tolerance, they are treated as continuous.' },
        { q: 'Are intervals sorted automatically?', a: 'Yes, if "Sort by start time" is enabled. This helps spot overlaps visually.' }
      ]
    },

    {
      slug: 'add-subtract-time',
      calcId: 'add-subtract',
      title: 'Add or Subtract Time — Time Arithmetic Calculator',
      description: 'Add or subtract durations from a time, or combine two durations. Free online time arithmetic calculator.',
      h1: 'Add or Subtract Time',
      lede: 'Add a duration to a time, subtract one, or combine two durations. Handles day boundaries automatically.',
      intro: `<p>Choose an operation — time plus duration, time minus duration, duration plus duration, or duration minus duration — and enter your values.</p>
<p>The result panel shows the answer and whether the calculation crossed a day boundary. For duration arithmetic the result may be negative; the calculator displays this clearly.</p>`,
      faq: [
        { q: 'Does it handle day rollover?', a: 'Yes. If adding two hours to 23:30 crosses midnight, the calculator wraps correctly and flags the day shift.' },
        { q: 'Can I enter negative durations?', a: 'Enter positive values and choose the subtraction operation instead.' }
      ]
    },

    {
      slug: 'date-difference',
      calcId: 'date-difference',
      title: 'Date Difference Calculator — Days Between Two Dates',
      description: 'Calculate the exact difference between two dates in days, weeks, months, years, hours, and minutes. Optional business day counting.',
      h1: 'Date & Time Difference Calculator',
      lede: 'Calculate the exact difference between two dates in every common unit, with optional business-day counting.',
      intro: `<p>Enter a start and end date (and optional times) and the calculator returns the difference in calendar years, months, days, hours, minutes, seconds, weeks, total days, total hours, total minutes, and total seconds.</p>
<p>Enable "Business days only" to exclude weekends and custom holiday dates. The result panel also shows the duration in ISO 8601 format, useful for technical work.</p>`,
      faq: [
        { q: 'What is ISO 8601 duration format?', a: 'A standard way of writing durations like P3Y2M14D (3 years, 2 months, 14 days). It is used in software and databases.' },
        { q: 'Can I exclude weekends?', a: 'Yes. Enable "Business days only" and the calculator counts only weekdays between the two dates.' },
        { q: 'Can I add holidays?', a: 'Yes. Enter holiday dates in the ISO format YYYY-MM-DD, one per line or comma-separated.' }
      ]
    },

    {
      slug: 'time-until',
      calcId: 'time-until',
      title: 'Time Until Calculator — Live Countdown to Any Date',
      description: 'Live countdown to any future date and time. Free online time until calculator with notifications.',
      h1: 'Time Until Calculator',
      lede: 'Count down live to a future date and time. Optionally receive a browser notification when the countdown finishes.',
      intro: `<p>Enter a target date and time and the calculator shows a live countdown updating every second. The result also breaks down the remaining time into days, hours, minutes, and seconds.</p>
<p>Enable notifications to be alerted when the countdown finishes. Everything is stored locally — no account, no server, no tracking.</p>`,
      faq: [
        { q: 'Can I add a label to my countdown?', a: 'Yes. Use the "Label" field to remind yourself what the countdown is for.' },
        { q: 'Does it work offline?', a: 'Yes. Once the page is loaded, the countdown runs entirely in your browser.' },
        { q: 'Will I get a notification if I close the tab?', a: 'No. Notifications only fire while the page is open in a tab. Keep the tab open if you need an alert.' }
      ]
    },

    {
      slug: 'time-since',
      calcId: 'time-since',
      title: 'Time Since Calculator — Live Elapsed Time Timer',
      description: 'Live elapsed time since any past date. Free online time since calculator for tracking duration.',
      h1: 'Time Since Calculator',
      lede: 'See exactly how much time has passed since any date and time. Live updating timer.',
      intro: `<p>Enter a start date and time and the calculator shows a live elapsed-time timer. The result also shows total days, weeks, hours, minutes, and seconds.</p>
<p>This is useful for tracking how long ago something happened — a project started, an event took place, a milestone was reached.</p>`,
      faq: [
        { q: 'Can I track multiple events?', a: 'Not in a single view, but you can save individual calculations to your browser and reload them later.' }
      ]
    },

    {
      slug: 'time-zone-converter',
      calcId: 'timezone',
      title: 'Time Zone Converter — Compare Times Across Cities',
      description: 'Convert times between any IANA time zones. Daylight-saving aware. Free online time zone converter.',
      h1: 'Time Zone Converter',
      lede: 'Convert a time between any two IANA time zones, with daylight-saving awareness and a 24-hour heatmap.',
      intro: `<p>Pick a source time zone and add as many destinations as you need. The converter shows the time in each zone, the UTC offset, the time zone abbreviation, and whether it falls in daytime, evening, or overnight hours.</p>
<p>It uses the browser's built-in Intl APIs and IANA time zone identifiers, so it is correct across historical and future daylight-saving transitions.</p>`,
      faq: [
        { q: 'How many time zones can I add?', a: 'As many as you need. Each one shows the local time, offset, and period of day.' },
        { q: 'Does it handle daylight saving?', a: 'Yes. The calculator detects DST transitions in destination zones and flags them.' },
        { q: 'Is there an external API call?', a: 'No. Everything runs in your browser using standard JavaScript date and time APIs.' }
      ]
    },

    {
      slug: 'shift-planner',
      calcId: 'shift-planner',
      title: 'Shift Planner — Plan Work Shifts and Rest Periods',
      description: 'Plan work shifts, calculate totals, and check rest periods between shifts. Free online shift planner.',
      h1: 'Shift Planner',
      lede: 'Plan multiple shifts, total the hours, and confirm minimum rest periods between them.',
      intro: `<p>Add each shift with its date, start and end time, break, and scheduled hours. The planner calculates total net hours, overtime, and undertime.</p>
<p>It also checks the rest between consecutive shifts and warns you if the gap is shorter than your configured minimum.</p>`,
      faq: [
        { q: 'Can I plan a full week?', a: 'Yes. Add one row per shift and the planner handles any number of shifts.' },
        { q: 'Does it detect overlaps?', a: 'Yes. If one shift starts before the previous one ends, the planner flags the overlap.' }
      ]
    },

    {
      slug: 'overtime',
      calcId: 'overtime',
      title: 'Overtime Calculator — Regular, Overtime and Double-Time Pay',
      description: 'Split hours into regular, overtime, and double time using your own rules. Free online overtime calculator.',
      h1: 'Overtime Calculator',
      lede: 'Split your hours into regular, overtime, and double time using thresholds you define. Includes jurisdiction templates.',
      intro: `<p>Enter your daily hours, days worked, and rate. Then set the daily and weekly thresholds that apply to you. The calculator splits your total hours into regular, overtime, and double time, and calculates pay for each band.</p>
<p>Preset templates are available for the US FLSA, California, the EU Working Time Directive, the UK, and Australia — but these are starting points, not legal advice. Always verify against your local labour law.</p>`,
      faq: [
        { q: 'What is double time?', a: 'Double time is a rate typically paid for very long days or on public holidays — often twice the base hourly rate.' },
        { q: 'Can I use my own thresholds?', a: 'Yes. Choose Custom in the template dropdown and set your own daily and weekly thresholds.' },
        { q: 'Is this legal advice?', a: 'No. Rules vary by country, state, and employer. Verify against your own contract and local labour law.' }
      ]
    },

    {
      slug: 'earnings',
      calcId: 'earnings',
      title: 'Time and Earnings Calculator — Turn Hours Into Pay',
      description: 'Calculate your earnings from regular, overtime, and double-time hours. Free online hours to pay calculator.',
      h1: 'Time and Earnings Calculator',
      lede: 'Enter your hours and rate to see regular, overtime, and double-time earnings, plus your effective hourly rate.',
      intro: `<p>Enter regular hours, overtime hours, and any double-time hours along with your hourly rate and multipliers. The calculator returns the earnings for each band and the total.</p>
<p>It also shows your effective hourly rate — the average you actually earned across all hours worked. An optional tax field estimates net earnings.</p>`,
      faq: [
        { q: 'What is the effective hourly rate?', a: 'The total gross earnings divided by total hours. It differs from your base rate when overtime or double-time is involved.' },
        { q: 'Does it calculate tax?', a: 'Only an estimate based on the flat rate you enter. Real tax calculations depend on your country and circumstances.' }
      ]
    },

    {
      slug: 'break-calculator',
      calcId: 'breaks',
      title: 'Break Calculator — Paid and Unpaid Break Impact',
      description: 'See how paid and unpaid breaks affect your net working time. Free online break calculator.',
      h1: 'Break Calculator',
      lede: 'Enter your shift and add each break. See gross shift, total break time, and net working hours.',
      intro: `<p>This calculator is focused specifically on how breaks affect your shift. Enter the shift start and end times, then add each break and mark it paid or unpaid.</p>
<p>The result shows the gross shift, total break time, paid and unpaid split, net working time, and the break percentage of the shift.</p>`,
      faq: [
        { q: 'What is break percentage?', a: 'The total break time divided by the gross shift length, expressed as a percentage.' }
      ]
    },

    {
      slug: 'time-breakdown',
      calcId: 'breakdown',
      title: 'Time Breakdown Calculator — Convert Any Duration',
      description: 'Convert any duration into weeks, days, hours, minutes, seconds, and milliseconds. Free online time breakdown tool.',
      h1: 'Time Breakdown Calculator',
      lede: 'Enter any duration in days, hours, minutes, seconds, and milliseconds. See it broken down into every unit.',
      intro: `<p>Enter the components of a duration and the calculator normalises them into weeks, days, hours, minutes, seconds, and milliseconds, plus totals.</p>
<p>Useful for converting durations between units, understanding large time spans, and checking calculations.</p>`,
      faq: [
        { q: 'Can I enter milliseconds?', a: 'Yes. Milliseconds are supported and shown in the total output.' }
      ]
    },

    {
      slug: 'timesheet-rounding',
      calcId: 'rounding',
      title: 'Timesheet Rounding Calculator — Compare Rounding Rules',
      description: 'Compare an exact duration against common timesheet rounding rules. Free online rounding calculator.',
      h1: 'Timesheet Rounding Calculator',
      lede: 'Compare an exact duration against every common rounding rule at once. See the difference each rule introduces.',
      intro: `<p>Enter an exact duration and the calculator applies every common rounding rule — nearest minute, 5, 6, 10, 15, 30, 60 minutes, always-up, always-down, and custom intervals.</p>
<p>You can also round the shift start and end times separately before subtracting, matching how many time-clock systems work.</p>`,
      faq: [
        { q: 'Why does my employer round times?', a: 'Rounding simplifies payroll processing and reduces disputes over exact minutes. Rules vary by employer and country.' },
        { q: 'Which rule is most common?', a: 'The nearest 6 minutes matches decimal hours exactly and is common in the US. The 15-minute rule is also widespread.' }
      ]
    },

    {
      slug: 'business-days',
      calcId: 'business-days',
      title: 'Business Days Calculator — Count or Add Working Days',
      description: 'Count business days between two dates or add business days to a date. Free online working days calculator.',
      h1: 'Business Days Calculator',
      lede: 'Count weekdays between two dates, or add and subtract business days from a starting date. Optionally exclude holidays.',
      intro: `<p>Choose the mode: count business days between two dates, or add and subtract business days from a starting date.</p>
<p>Custom holiday dates can be supplied in ISO format (YYYY-MM-DD) and are excluded from the count. This is the calculation used for delivery estimates, contract deadlines, and leave planning.</p>`,
      faq: [
        { q: 'Does it count the start date?', a: 'By default, no. Enable "Include start date" if you want both endpoints counted.' },
        { q: 'How do I enter holidays?', a: 'Use YYYY-MM-DD format, one per line or comma-separated.' },
        { q: 'Which days count as business days?', a: 'Monday through Friday. Weekends are always excluded.' }
      ]
    },

    {
      slug: 'age-calculator',
      calcId: 'age',
      title: 'Age Calculator — Exact Age, Next Birthday & Time Lived',
      description: 'Calculate exact age in years, months, days, and hours. See your next birthday and total time lived. Free online age calculator.',
      h1: 'Age Calculator',
      lede: 'Calculate your exact age, next birthday, and total time lived in days, hours, and minutes.',
      intro: `<p>Enter your date of birth and the calculator returns your exact age in years, months, and days, along with your total time lived in days, weeks, and hours.</p>
<p>It also shows what day of the week you were born and how many days until your next birthday.</p>`,
      faq: [
        { q: 'Can I calculate age at a past date?', a: 'Yes. Change the "Age at date" field to any date to see your age at that moment.' },
        { q: 'Does it account for leap years?', a: 'Yes. All calculations use the actual calendar with leap years included.' }
      ]
    },

    {
      slug: 'speed-saver',
      calcId: 'speed',
      title: 'Video Speed Calculator — Watch Time at Different Speeds',
      description: 'See how long a video or audio file takes to play at any speed. Free online playback speed calculator.',
      h1: 'Video / Audio Speed Saver',
      lede: 'Enter the duration of a video or audio file and see how long it takes to watch at any speed.',
      intro: `<p>Choose a playback speed from 0.5× to 3× or enter a custom value. The calculator shows the new duration and how much time you save.</p>
<p>Useful for podcasts, lecture recordings, and long-form video where playback speed affects the total time commitment.</p>`,
      faq: [
        { q: 'What if I need the same content at multiple speeds?', a: 'Run the calculator once for each speed and note the results.' }
      ]
    },

    {
      slug: 'pomodoro-planner',
      calcId: 'pomodoro',
      title: 'Pomodoro Planner — Plan Focus Sessions',
      description: 'Plan Pomodoro focus sessions and see total time committed. Free online Pomodoro planner.',
      h1: 'Pomodoro Timer Planner',
      lede: 'Plan focus sessions and breaks and see the total time commitment before you start.',
      intro: `<p>Set your focus length, short break, long break, and how many sessions you want. The planner generates a schedule and totals the focus and break time.</p>
<p>Use it to plan a work block, study session, or deep work window before you commit.</p>`,
      faq: [
        { q: 'What is a typical Pomodoro?', a: 'The classic is 25 minutes focus, 5 minutes break, with a longer break every four sessions.' }
      ]
    },

    {
      slug: 'world-clock',
      calcId: 'world-clock',
      title: 'World Clock — Current Time in Multiple Cities',
      description: 'See the current time in any number of cities and time zones. Free online world clock.',
      h1: 'World Clock',
      lede: 'Add cities from any IANA time zone and see the local time in each, live-updating.',
      intro: `<p>Add as many cities or time zones as you need. The clock shows the current local time in each, whether it is daytime, evening, or overnight, and the UTC reference time.</p>
<p>All clocks update live and respect daylight-saving transitions.</p>`,
      faq: [
        { q: 'How many cities can I add?', a: 'As many as you need. Each addition shows its local time and period of day.' }
      ]
    },

    {
      slug: 'sleep-calculator',
      calcId: 'sleep',
      title: 'Sleep Calculator — Best Bedtimes and Wake Times',
      description: 'Find the best bedtime or wake time based on 90-minute sleep cycles. Free online sleep calculator.',
      h1: 'Sleep Calculator',
      lede: 'Find ideal bedtimes or wake times based on 90-minute sleep cycles and how long it takes you to fall asleep.',
      intro: `<p>Choose whether you want to wake up at a specific time or go to bed at a specific time. The calculator suggests bedtimes or wake times in 90-minute intervals — the length of a full sleep cycle.</p>
<p>Waking at the end of a cycle feels far less groggy than waking in the middle of one.</p>`,
      faq: [
        { q: 'What is a sleep cycle?', a: 'Sleep cycles last about 90 minutes and move through light, deep, and REM stages. Waking between cycles feels easier.' },
        { q: 'How accurate is this?', a: 'It is a planning tool, not medical advice. Most adults need 5–6 cycles (7.5–9 hours).' }
      ]
    },

    {
      slug: 'pay-period',
      calcId: 'pay-period',
      title: 'Pay Period Calculator — Pay Dates and Period Boundaries',
      description: 'Find pay period boundaries and pay dates for weekly, bi-weekly, semi-monthly, or monthly schedules. Free online pay period calculator.',
      h1: 'Pay Period Calculator',
      lede: 'Enter a known pay date and see the current period plus the next several cycles, with pay dates.',
      intro: `<p>Choose your pay frequency (weekly, bi-weekly, semi-monthly, or monthly), enter a known pay date, and the calculator generates the surrounding periods along with their pay dates.</p>
<p>It also shows how many days are left in the current period.</p>`,
      faq: [
        { q: 'What is the difference between bi-weekly and semi-monthly?', a: 'Bi-weekly pays every two weeks (26 payments per year). Semi-monthly pays twice a month (24 payments per year).' }
      ]
    },

    {
      slug: 'course-hours',
      calcId: 'course-hours',
      title: 'Course Hours Calculator — Contact Hours Across a Term',
      description: 'Calculate total contact hours and sessions across a course term. Free online course hours calculator.',
      h1: 'Course & Credit Hours Calculator',
      lede: 'Calculate total contact hours, sessions, and teaching weeks across a term.',
      intro: `<p>Enter your weekly contact hours, term length, break weeks, and session length. The calculator returns total contact hours and total sessions.</p>
<p>Useful for course planning, credit hour calculations, and instructor workload estimates.</p>`,
      faq: [
        { q: 'What is a credit hour?', a: 'In the US, one credit hour typically represents one hour of classroom instruction per week for a 15-week term.' }
      ]
    },

    {
      slug: 'punch-clock',
      calcId: 'punch-clock',
      title: 'Punch Clock Calculator — Total Hours from Clock-In/Out',
      description: 'Track clock-in and clock-out pairs and total the hours. Free online punch clock calculator.',
      h1: 'Punch Clock Calculator',
      lede: 'Add each clock-in and clock-out pair and see the total hours, with optional earnings estimate.',
      intro: `<p>Enter each pair of clock-in and clock-out times. The calculator sums each pair and the total, and can estimate earnings if you supply an hourly rate.</p>
<p>Ideal for simple time tracking without needing timesheet categories or billable toggles.</p>`,
      faq: [
        { q: 'Can I track a full week?', a: 'Yes. Add one punch pair for each shift and the calculator handles any number.' }
      ]
    },

    {
      slug: 'meeting-cost',
      calcId: 'meeting-cost',
      title: 'Meeting Cost Calculator — What Your Meeting Actually Costs',
      description: 'Calculate the real cost of a meeting based on attendees, hourly rates, and duration. Free online meeting cost calculator.',
      h1: 'Meeting Cost Calculator',
      lede: 'See what a meeting actually costs based on the number of attendees and their average hourly rate.',
      intro: `<p>Enter the number of attendees, their average hourly rate, and the meeting duration. The calculator returns the cost per minute, cost per attendee, and total cost.</p>
<p>For recurring meetings it estimates the annual cost and warns when a meeting has unusually high attendee count or cost.</p>`,
      faq: [
        { q: 'How should I set the average rate?', a: 'Use the fully-loaded hourly cost if you have it (salary plus benefits divided by working hours). Otherwise a reasonable average salary divided by 2,080 hours is a starting point.' },
        { q: 'Why does it warn about annual cost?', a: 'Recurring meetings compound quickly. A one-hour weekly meeting with ten attendees can cost more than $100,000 per year at typical rates.' }
      ]
    }
  ]
};
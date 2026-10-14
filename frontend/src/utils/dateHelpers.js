export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

export const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('en-US', { month: 'long' });
};

export const calculateNextDueDate = (card) => {
  if (!card || !card.creditTermsConfigured || !card.statementClosingDay || !card.paymentDueDay) return null;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const lastDayThisMonth = new Date(year, month + 1, 0).getDate();
  const closeDay = Math.min(Number(card.statementClosingDay), lastDayThisMonth);
  const closingThisMonth = new Date(year, month, closeDay);
  
  let targetClose;
  if (now > closingThisMonth) {
    const nextMonth = new Date(year, month + 1, 1);
    const lastDayNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    targetClose = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(Number(card.statementClosingDay), lastDayNextMonth));
  } else {
    targetClose = closingThisMonth;
  }
  
  const dueMonth = new Date(targetClose.getFullYear(), targetClose.getMonth() + 1, 1);
  const lastDayDueMonth = new Date(dueMonth.getFullYear(), dueMonth.getMonth() + 1, 0).getDate();
  const dueDate = new Date(dueMonth.getFullYear(), dueMonth.getMonth(), Math.min(Number(card.paymentDueDay), lastDayDueMonth));
  
  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  const dateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  let status = 'upcoming';
  if (diffDays < 0) status = 'overdue';
  else if (diffDays === 0) status = 'due_today';
  
  return { dueDate, dateStr, diffDays, status };
};


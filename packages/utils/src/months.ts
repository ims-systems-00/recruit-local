export const getMonthNameFromNumber = (month: number): string => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[month - 1];
};

export const generateMonthRangeFromNumber = (
  months: number,
): Array<{ year: number; month: number }> => {
  const result = [];
  const currentDate = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);
    result.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }
  return result.reverse();
};

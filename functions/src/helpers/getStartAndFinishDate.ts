export default function getStartAndFinishDates(inputDate: string) {
    const startDate = new Date(inputDate);
    startDate.setHours(5, 0, 0, 0);
    const finishDate = new Date(startDate);
    finishDate.setDate(finishDate.getDate() + 1);
    return {
        startDate,
        finishDate
    };
}
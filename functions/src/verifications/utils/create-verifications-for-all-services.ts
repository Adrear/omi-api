// async createVerificationsForAllServices(month: string) {
//     try {
//         const servicesSnapshot = await this.servicesCollection.get();
//         if (servicesSnapshot.empty) {
//             this.logger.warn('No services found.');
//             return;
//         }
//
//         for (const serviceDoc of servicesSnapshot.docs) {
//             const serviceID = serviceDoc.id;
//             this.logger.log(`Processing service: ${serviceID}`);
//             await this.createVerificationsByServiceForMonth(serviceID, month);
//         }
//         this.logger.log(`Дані для всіх сервісів за місяць ${month} успішно оброблені.`);
//     } catch (error) {
//         this.logger.error('Error in createVerificationsForAllServices:', error);
//     }
// }
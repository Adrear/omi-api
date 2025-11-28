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
//     } catch (error) {
//         this.logger.error('Error in createVerificationsForAllServices:', error);
//     }
// }

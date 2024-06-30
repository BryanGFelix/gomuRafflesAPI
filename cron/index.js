import drawWinners from "./drawWinners";
// import cleanupStaleRaffles from "./cleanupStaleRaffles";

// Function to start all cron jobs
const startCronJobs = () => {
    // Schedule the job to run every minute
    cron.schedule('* * * * *', drawWinners);
    // // Schedule the job to run every hour
    // cron.schedule('0 * * * *', cleanupStaleRaffles);
  
};

export default startCronJobs;
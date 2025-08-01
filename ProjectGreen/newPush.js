const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
const { format } = require('date-fns');

const FILE = 'log.txt';

function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// asking for user input
rl.question("Enter from date (YYYY-MM-DD): ", function(fromDateInput) {
    rl.question("Enter final date (YYYY-MM-DD): ", function(finalDateInput) {
        rl.question("How many commits per day? ", function(commitsPerDayInput) {
            let fromDate = new Date(fromDateInput);
            let finalDate = new Date(finalDateInput);
            let commitsPerDay = parseInt(commitsPerDayInput);

            if (isNaN(commitsPerDay)) {
                console.log("Invalid number for commits per day");
                rl.close();
                return;
            }

            console.log("Starting commits from", fromDateInput, "to", finalDateInput);

            let currentDate = new Date(fromDate);

            while (currentDate <= finalDate) {
                for (let i = 1; i <= commitsPerDay; i++) {
                    let hour = 12;
                    let minute = i * 10;

                    if (minute >= 60) {
                        hour += Math.floor(minute / 60);
                        minute = minute % 60;
                    }

                    let minStr = minute < 10 ? '0' + minute : minute.toString();
                    let hourStr = hour < 10 ? '0' + hour : hour.toString();

                    let timestamp = format(currentDate, 'yyyy-MM-dd') + 'T' + hourStr + ':' + minStr + ':00';

                    fs.appendFileSync(FILE, 'Commit at ' + timestamp + '\n');

                    try {
                        execSync("git add .");
                        execSync(`git commit --date="${timestamp}" -m "Backdated commit ${timestamp}"`, {
                            env: {
                                ...process.env,
                                GIT_AUTHOR_DATE: timestamp,
                                GIT_COMMITTER_DATE: timestamp
                            }
                        });

                        console.log("Committed at", timestamp);
                    } catch (err) {
                        console.log("Error making commit at", timestamp);
                        console.log(err.message);
                    }
                }

                currentDate = addDays(currentDate, 1);
            }

            try {
                console.log("Pushing to GitHub...");
                execSync("git push", { stdio: 'inherit' });
                console.log("Pushed everything");
            } catch (err) {
                console.log("Failed to push");
                console.log(err.message);
            }

            rl.close();
        });
    });
});

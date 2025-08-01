const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
const { format } = require('date-fns');
const path = require('path');

// Setup input interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

(async () => {
    console.log("🔧 Welcome to CommitForge");
    
    const repoURL = await ask("Paste your GitHub repo URL (e.g., https://github.com/user/repo.git): ");
    const fromDateInput = await ask("Enter FROM date (YYYY-MM-DD): ");
    const finalDateInput = await ask("Enter TO date (YYYY-MM-DD): ");
    const commitsPerDayInput = await ask("How many commits per day? ");

    const commitsPerDay = parseInt(commitsPerDayInput);
    if (isNaN(commitsPerDay)) {
        console.log("❌ Invalid number for commits per day.");
        rl.close();
        return;
    }

    const folderName = path.basename(repoURL, '.git');
    if (!fs.existsSync(folderName)) {
        console.log("📦 Cloning repo...");
        try {
            execSync(`git clone ${repoURL}`);
        } catch (err) {
            console.log("❌ Failed to clone repo:", err.message);
            rl.close();
            return;
        }
    } else {
        console.log("📁 Repo already exists locally.");
    }

    process.chdir(folderName);
    const FILE = 'log.txt';

    let currentDate = new Date(fromDateInput);
    const finalDate = new Date(finalDateInput);

    console.log(`🕒 Starting commits from ${fromDateInput} to ${finalDateInput}...`);

    while (currentDate <= finalDate) {
        for (let i = 1; i <= commitsPerDay; i++) {
            let hour = 12;
            let minute = i * 10;
            if (minute >= 60) {
                hour += Math.floor(minute / 60);
                minute = minute % 60;
            }

            const minStr = minute < 10 ? '0' + minute : minute.toString();
            const hourStr = hour < 10 ? '0' + hour : hour.toString();
            const timestamp = format(currentDate, 'yyyy-MM-dd') + 'T' + hourStr + ':' + minStr + ':00';

            fs.appendFileSync(FILE, `Commit at ${timestamp} - ${Math.random()}\n`);

            try {
                execSync("git add .");
                execSync(`git commit --date="${timestamp}" -m "Backdated commit ${timestamp}"`, {
                    env: {
                        ...process.env,
                        GIT_AUTHOR_DATE: timestamp,
                        GIT_COMMITTER_DATE: timestamp
                    }
                });

                console.log(`✅ Committed at ${timestamp}`);
            } catch (err) {
                console.log("⚠️ Commit failed at", timestamp);
                console.log(err.message);
            }
        }
        currentDate = addDays(currentDate, 1);
    }

    try {
        console.log("🚀 Pushing to GitHub...");
        execSync("git push -u origin main", { stdio: 'inherit' });
        console.log("✅ All commits pushed!");
    } catch (err) {
        console.log("❌ Failed to push:", err.message);
    }

    rl.close();
})();

const cfb = require('cfb-data');

function getTeamRegex(teams) {
  let regexString = '';

  teams.forEach(team => {
    regexString += team + '|'; 
  });

  // Slice gets rid of the trailing pipe
  return new RegExp(regexString.slice(0, -1), 'gi');
}

async function getSchedule(teams) {
  const options = {
    groups: 80, // 80 = all FBS games
    year: 2019,
    week: 1
  }

  const schedule = await cfb.schedule.getSchedule(options);
  const weeklySchedule = schedule.content.schedule;

  const regex = getTeamRegex(teams);

  const returnSchedule = [];
  for (const date in weeklySchedule) {
    const games = weeklySchedule[date].games;
    games.forEach(game => {
      if (game.name.match(regex)) {
        returnSchedule.push(game);
      }
    });
  }

  return returnSchedule;
}

async function constructEmail(schedule) {
  let cacheDate = null;
  let emailStr = '';
  for (const index in schedule) {

    if (schedule.hasOwnProperty(index)) {
      const game = schedule[index];

      const date = new Date(game.date);
      const gameDate =  date.toDateString();
      if (gameDate !== cacheDate) {
        cacheDate = gameDate;
        emailStr += `<h3>${gameDate}</h3>`;
      }

      const competition = game.competitions[0];
      const competitors = competition.competitors;
      const networkName = competition.geoBroadcasts[0].media.shortName;

      // Get the team logos with away team first.
      const awayIndex = competitors[0].homeAway === 'away' ? 0 : 1;
      const homeIndex = competitors[0].homeAway === 'home' ? 0 : 1;
      const awayRank = (competitors[awayIndex].curatedRank.current !== 99) ? `(${competitors[awayIndex].curatedRank.current})` : '';
      const homeRank = (competitors[homeIndex].curatedRank.current !== 99) ? `(${competitors[homeIndex].curatedRank.current})` : '';

      const teamLogos = [
        competitors[awayIndex].team.logo,
        competitors[homeIndex].team.logo,
      ];

      emailStr += `<img src="${teamLogos[0]}" width="64px" height="64px" />${awayRank} @ <img src="${teamLogos[1]}" width="64px" height="64px" />${homeRank}<br/><br/>`;
      emailStr += `<strong>${game.shortName}</strong><br/><br/>`;
      if (game.weather !== undefined) {
        emailStr += `Weather: ${game.weather.displayValue}, High: ${game.weather.highTemperature}<br>`;
      }
      emailStr += `Network: ${networkName}`;
      emailStr += '<br/>------------------------------<br/>';
    }
  }
  
  return emailStr;
}

const teamsToGet = [
  'Illinois Fighting Illini',
  'Indiana Hoosiers',
  'Iowa Hawkeyes',
  'Maryland Terrapins',
  'Michigan State Spartans',
  'Michigan Wolverines',
  'Minnesota Golden Gophers',
  'Nebraska Cornhuskers',
  'Northwestern Wildcats',
  'Ohio State Buckeyes',
  'Penn State Nittany Lions',
  'Purdue Boilermakers',
  'Rutgers Scarlet Knights',
  'Wisconsin Badgers',
  'Bowling Green Falcons',
  'Toledo Rockets'
];

getSchedule(teamsToGet).then((schedule) => {
  return constructEmail(schedule);
})
.then((emailStr) => {
  console.log(emailStr);
});

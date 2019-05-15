const sqlite3 = require('sqlite3').verbose();

var random_ids = {};
var args = process.argv.slice(2);
var ignored = ['srabin']
console.log(ignored)

const Discord = require('discord.js')
const client = new Discord.Client()
let get_random_id = function(author) {
	if (author in random_ids) {
	    return random_ids[author]
	} else {
		random_ids[author] = Math.floor(Math.random() * 10000000)
		return random_ids[author]
	}
}
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)

    let db = new sqlite3.Database('./db/ghidra_discord.db', (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Connected to the ghidra_discord database.');
    });

    db.serialize(() => {
      db.each(`create table if not exists users (real_id TEXT PRIMARY KEY, username TEXT NOT NULL, bot TEXT NOT NULL, createdAt TEXT NOT NULL, note TEXT, tag TEXT NOT NULL, roles TEXT NOT NULL, permissions TEXT, guild TEXT NOT NULL);`, (err, row) => {
        if (err) {
          console.error(err.message);
        }
      });
    });

    db.serialize(() => {
      db.each(`create table if not exists messages (ID INTEGER PRIMARY KEY, author TEXT, channel TEXT, content TEXT NOT NULL, createdAt TEXT NOT NULL, hit TEXT, embeds TEXT, pinned TEXT NOT NULL, history TEXT);`, (err, row) => {
        if (err) {
          console.error(err.message);
        }
      });
    });

    db.serialize(() => {
      db.each(`create table if not exists prescence (userID INTEGER PRIMARY KEY, messageID INTEGER TEXT NOT NULL, prescence TEXT NOT NULL);`, (err, row) => {
        if (err) {
          console.error(err.message);
        }
      });
    });

    db.serialize(() => {
      db.each(`create table if not exists reactions (userID INTEGER PRIMARY KEY, messageID INTEGER TEXT NOT NULL, emoji_name TEXT NOT NULL);`, (err, row) => {
        if (err) {
          console.error(err.message);
        }
      });
    });

    db.serialize(() => {
      db.each(`create table if not exists mentioned (messageID INTEGER PRIMARY KEY, mentioned TEXT NOT NULL);`, (err, row) => {
        if (err) {
          console.error(err.message);
        }
      });
    });

    db.serialize(() => {
      db.each(`create table if not exists attachments (messageID INTEGER PRIMARY KEY, filename TEXT NOT NULL, url TEXT NOT NULL);`, (err, row) => {
        if (err) {
          console.error(err.message);
        }
      });
    });

    // Go through all the users and check to see if they are already in the table...if not, add them.
    client.guilds.array().forEach(guild => {
        console.log(`guild: ${guild.name}`)
        guild.members.array().forEach(member => {
            	let sql = `SELECT username FROM users WHERE real_id = ?`
              	db.get(sql, [member.id], (err, row) => {
                	if (err) {
                    	console.error(err.message);
                	}
	                if (!row) {
	                	console.log("Trying to insert row")
	                   	let sql = `INSERT INTO users (real_id, username, bot, createdAt, note, tag, roles, permissions, guild) VALUES (?,?,?,?,?,?,?,?,?)`;
	                   	let roles = member.roles.array()
	                   	let roleString = ""
	                   	roles.forEach(role => {
	                   		roleString += role.name
	                   	});
	                   	var author = get_random_id(member.user.username)
	                   	var id = get_random_id(member.user.id)
	                    db.get(sql, [id,author,member.user.bot,member.user.createdAt,member.user.note, member.user.tag, roleString, member.permissions.ALL, member.guild.name])
	                	console.log("Inserted row")
	                }
              	});
        });
    });
    
    client.guilds.array().forEach(guild => {
        console.log(`guild: ${guild.name}`)
        guild.channels.array().forEach(channel => {
            console.log(`channel: ${channel.id}`)
			if(channel.type=="text"){
	            channel.fetchMessages().then(messages => {
	                messages.array().forEach( message => {
	                	let sql = 'SELECT author FROM messages WHERE ID = ?'
	                	db.get(sql, [message.id], (err, row) => {
	                		if (err) {
	                			console.error(err.message)
	                		}
	                		var found_ignored = false
	                		ignored.forEach(user => {
	                			console.log(user)
	                			let re = /({user} )/
	                			let match = re.test(message.content)
	                			console.log(match)
	                			found_ignored = match || found_ignored || message.author.username == user
	                		})
	            
	                		
	                		if (!row && !found_ignored) {
	                			console.log("Trying to insert message")
	                			var author = get_random_id(message.author.username)
			                   	let sql = `INSERT INTO messages (ID, author, channel, content, createdAt, hit, embeds, pinned, history) VALUES (?,?,?,?,?,?,?,?,?)`;
			                   	var content = message.content.replace(/@[.\S]+/, function(x) {
							  		return "@" + get_random_id(x.slice(1))
							  	});
			                    db.get(sql, [message.id,author,message.channel,content,message.createdAt,message.hit,message.embeds,message.pinned,null])
			                	console.log(`Old message: ${content} in ${message.channel} by ${author}, ${message.author.username}`)
	                		}
	                	}) 
	                });
	            });
			}
        });

    });
});

client.on('guildMemberAdd', member => {

});


client.on('message', msg => {
  console.log(`Content: ${msg.content} by ${msg.author.id}, ${msg.author.note}, ${msg.author.username}, ${msg.author.createdTimestamp}`)
});	
client.login('<login token>')

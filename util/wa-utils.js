const getDisplayName = author => {
    return author.name || author.pushname || author.number;
}

const cleanChatName = name => {
    const pattern = /^[a-z0-9]+$/i;
    let newName = '';
    [...name].forEach(c => {
        if(c === ' ') newName += '-';
        else if(pattern.test(c)) newName += c.toLowerCase();
    });

    name = newName;
    newName = '';
    let x = 0;
    [...name].forEach(c => {
        if(c === '-') {
            x++;
            if(x < 2) {
                newName += '-';
            }
            else {
                x--;
            }
        }
        else {
            newName += c;
            x = 0;
        }
    });

    return newName;
}

module.exports = {
    getDisplayName: getDisplayName,
    cleanChatName: cleanChatName
}

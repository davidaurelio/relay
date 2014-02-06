var referee = require('referee'), sinon = require('sinon');
referee.format = require('formatio').configure({quoteStrings: false}).ascii;
require('referee-sinon')(referee, sinon);

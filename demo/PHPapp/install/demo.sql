-- Demo specific fields
ALTER IGNORE TABLE `Users` ADD `website` VARCHAR( 50 ) NOT NULL DEFAULT '' AFTER `Username` ;
ALTER IGNORE TABLE `Users` ADD `last_name` VARCHAR( 15 ) NOT NULL DEFAULT '' AFTER `Username` ;
ALTER IGNORE TABLE `Users` ADD `first_name` VARCHAR( 15 ) NOT NULL DEFAULT '' AFTER `Username` ;
ALTER IGNORE TABLE `Users` ADD `ape_session` VARCHAR( 15 ) NOT NULL DEFAULT '';
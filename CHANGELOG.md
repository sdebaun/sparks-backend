<a name="1.0.0"></a>
# 1.0.0 (2016-08-03)


### Bug Fixes

* **Shifts:** fix typo in shifts update ([2d21656](https://github.com/sdebaun/sparks-backend/commit/2d21656))
* fix filtering by project name ([2a6443b](https://github.com/sdebaun/sparks-backend/commit/2a6443b))
* **Arrivals,Seneca:** Fix the expected arguments of the arrivals create action ([2f8326a](https://github.com/sdebaun/sparks-backend/commit/2f8326a))
* **Assigments:** fix deleting an assigment ([9cf993d](https://github.com/sdebaun/sparks-backend/commit/9cf993d))
* **Assignemnts:** do not attempt to update shift count if assignment has no shift key ([3af8929](https://github.com/sdebaun/sparks-backend/commit/3af8929))
* **deploy:** add babel-cli to dependencies ([4991cbc](https://github.com/sdebaun/sparks-backend/commit/4991cbc))
* **Deploy:** Fix the same of the heroku repo ([e1fae35](https://github.com/sdebaun/sparks-backend/commit/e1fae35))
* **Dispatch:** don't crash when task cannot be processed ([ed30148](https://github.com/sdebaun/sparks-backend/commit/ed30148))
* **Engagements:** look up profiles by engagement.profileKey ([5d9862e](https://github.com/sdebaun/sparks-backend/commit/5d9862e))
* **injection:** incorrect initialization of getStuff ([fc55a83](https://github.com/sdebaun/sparks-backend/commit/fc55a83))
* **Pay:** A callback was being given to a thenable causing errors to be thrown when emails were sent ([1185062](https://github.com/sdebaun/sparks-backend/commit/1185062))
* **Payments:** Remove tap from promise chain ([c283935](https://github.com/sdebaun/sparks-backend/commit/c283935))
* Fix the image uploading by returning the set promise, otherwise it does not run ([6f8289e](https://github.com/sdebaun/sparks-backend/commit/6f8289e))
* fix typo ([9240819](https://github.com/sdebaun/sparks-backend/commit/9240819))
* **Profiles:** fix import line in profiles ([930b7cc](https://github.com/sdebaun/sparks-backend/commit/930b7cc))
* **ProjectImages:** allows admins to change the project image ([f9b3ff1](https://github.com/sdebaun/sparks-backend/commit/f9b3ff1))
* **ProjectImages:** fix broken image setting ([8adfb2d](https://github.com/sdebaun/sparks-backend/commit/8adfb2d))
* **Shifts:** Do not apply permissions to shifts updateCount action ([8ea4c30](https://github.com/sdebaun/sparks-backend/commit/8ea4c30))
* **ShiftUpdateCount:** Do not throw an error when seneca task fails, instead return information about the error ([1400d1b](https://github.com/sdebaun/sparks-backend/commit/1400d1b))


### Features

* [WIP] - send email when engagament is created ([489de5d](https://github.com/sdebaun/sparks-backend/commit/489de5d))
* [WIP] only send emails when confirmations are on ([8094b10](https://github.com/sdebaun/sparks-backend/commit/8094b10))
* acceptance email ([1fec498](https://github.com/sdebaun/sparks-backend/commit/1fec498))
* add ability to add image ([7534463](https://github.com/sdebaun/sparks-backend/commit/7534463))
* automatic engagement creation email with template ([4dd266b](https://github.com/sdebaun/sparks-backend/commit/4dd266b))
* bacis create and update shifts ([970d1c9](https://github.com/sdebaun/sparks-backend/commit/970d1c9))
* **Arrivals:** Implement arrival creation ([d7217dc](https://github.com/sdebaun/sparks-backend/commit/d7217dc))
* **ConfirmWithoutPay:** implement confirm without pay action ([3f3bd5f](https://github.com/sdebaun/sparks-backend/commit/3f3bd5f))
* **Deploy:** Auto deploy backend to production on master branch pushes ([c0085cf](https://github.com/sdebaun/sparks-backend/commit/c0085cf))
* **Engagements:** send confirmation email ([8c3693b](https://github.com/sdebaun/sparks-backend/commit/8c3693b))
* **Export:** Do not load all engagements ([337afb3](https://github.com/sdebaun/sparks-backend/commit/337afb3))
* **Organizers:** send email to invite organizers ([5a18016](https://github.com/sdebaun/sparks-backend/commit/5a18016))
* **Organizers:** Update all security rules to reflect that organizers ([817d44c](https://github.com/sdebaun/sparks-backend/commit/817d44c))
* **Seneca:** implement all actions as seneca services ([9357ab2](https://github.com/sdebaun/sparks-backend/commit/9357ab2))




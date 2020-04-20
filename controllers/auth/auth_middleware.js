module.exports = {
    loggedin: (req, res, next) => {
        if (req.isAuthenticated())
            next();
        else {
            req.flash('danger','You are not logged in !');
            res.redirect('/login');
        }            
    },
    loggedin_as_admin: (req, res, next) => {
        if (req.isAuthenticated()) {
            const user = req.user;
            if (user.user_type === 'ADMIN') {
                next();
            }
            else {
                req.flash('danger', 'You are not authorized to access the page !');
                res.redirect('/');
            }
        }
        else {
            req.flash('danger', 'You are not logged in !');
            res.redirect('/login');
        }
    },
    loggedin_as_superuser: (req, res, next) => {
        if (req.isAuthenticated()) {
            const user = req.user;
            if (user.user_type === 'ADMIN' || user.user_type === 'SUPERUSER') {
                next();
            }
            else {
                req.flash('danger', 'You are not authorized to access the page !');
                res.redirect('/');
            }
        }
        else {
            req.flash('danger', 'You are not logged in !');
            res.redirect('/login');
        }
    }
}
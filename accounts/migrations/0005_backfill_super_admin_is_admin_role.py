from django.db import migrations


def set_super_admin_flag(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name='Super Administrator').update(is_admin_role=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_allow_multiple_sessions_and_more'),
    ]

    operations = [
        migrations.RunPython(set_super_admin_flag, noop_reverse),
    ]